import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { createChildLogger } from "./logger";
import { requireAdmin } from "./middleware/authorization";
import {
  authLimiter,
  notificationLimiter,
  broadcastLimiter,
  createResourceLimiter,
} from "./rateLimiter";
import {
  registerPushTokenSchema,
  sendNotificationSchema,
  broadcastNotificationSchema,
  createHistorySchema,
  updateHistoryStatusSchema,
  historyQuerySchema,
  updatePreferencesSchema,
} from "./validation";
import {
  addHistoryEntry,
  getHistoryForUser,
  updateHistoryStatus,
} from "./historyStore";
import {
  getAccountPreferences,
  updateAccountPreferences,
} from "./accountPreferences";

const routesLogger = createChildLogger("routes");

// Typed request with authenticated user
interface AuthenticatedRequest extends Request {
  user: Express.User;
}

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

async function sendPushNotification(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };

  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Expo push failed: ${error}`);
  }

  const result: ExpoPushResponse = await response.json();
  console.log('Push notification result:', JSON.stringify(result, null, 2));

  const invalidTokens: string[] = [];
  result.data.forEach((ticket, index) => {
    if (ticket.status === 'error') {
      const errorType = ticket.details?.error;
      if (errorType === 'DeviceNotRegistered' || errorType === 'InvalidCredentials') {
        invalidTokens.push(messages[index].to);
      }
      console.error(`Push error for ${messages[index].to}:`, ticket.message);
    }
  });

  if (invalidTokens.length > 0) {
    console.log(`Removing ${invalidTokens.length} invalid tokens`);
    for (const token of invalidTokens) {
      await storage.removePushToken(token);
    }
  }

  return result.data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get('/api', (_req, res) => {
    res.json({ 
      message: 'Lavei API', 
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        auth: {
          register: 'POST /api/register',
          login: 'POST /api/login',
          logout: 'POST /api/logout',
          user: 'GET /api/auth/user',
          google: 'GET /api/auth/google'
        },
        notifications: {
          register: 'POST /api/notifications/register',
          send: 'POST /api/notifications/send',
          broadcast: 'POST /api/notifications/broadcast'
        },
        history: {
          list: 'GET /api/history',
          create: 'POST /api/history',
          updateStatus: 'PATCH /api/history/:serviceId/status'
        },
        account: {
          details: 'GET /api/account',
          updatePreferences: 'PUT /api/account/preferences'
        }
      }
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============================================
  // Notification Routes
  // ============================================

  app.post('/api/notifications/register', isAuthenticated, notificationLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = registerPushTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const { expoPushToken } = parsed.data;
      const token = await storage.savePushToken(authReq.user.id, expoPushToken);
      routesLogger.info({ userId: authReq.user.id }, "Push token registered");
      res.json({ success: true, tokenId: token.id });
    } catch (error) {
      routesLogger.error({ error }, "Error registering push token");
      res.status(500).json({ error: 'Falha ao registrar token de notificação' });
    }
  });

  app.post('/api/notifications/send', isAuthenticated, notificationLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = sendNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const { title, body, data, targetUserId } = parsed.data;

      const tokens = targetUserId
        ? await storage.getPushTokensForUser(targetUserId)
        : await storage.getPushTokensForUser(authReq.user.id);

      if (tokens.length === 0) {
        return res.status(404).json({ error: 'Nenhum token de notificação encontrado' });
      }

      const messages: ExpoPushMessage[] = tokens.map(t => ({
        to: t.expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
      }));

      const tickets = await sendPushNotification(messages);
      const successCount = tickets.filter(t => t.status === 'ok').length;

      res.json({ 
        success: true, 
        sentTo: tokens.length,
        delivered: successCount,
        failed: tokens.length - successCount
      });
    } catch (error) {
      routesLogger.error({ error }, "Error sending push notification");
      res.status(500).json({ error: 'Falha ao enviar notificação' });
    }
  });

  // Broadcast requires admin role
  app.post('/api/notifications/broadcast', isAuthenticated, requireAdmin, broadcastLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = broadcastNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const { title, body, data } = parsed.data;

      const allTokens = await storage.getAllPushTokens();

      if (allTokens.length === 0) {
        return res.status(404).json({ error: 'Nenhum token de notificação registrado' });
      }

      const messages: ExpoPushMessage[] = allTokens.map(t => ({
        to: t.expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
      }));

      const tickets = await sendPushNotification(messages);
      const successCount = tickets.filter(t => t.status === 'ok').length;

      routesLogger.info({ userId: authReq.user.id, sentTo: allTokens.length }, "Broadcast notification sent");

      res.json({ 
        success: true, 
        sentTo: allTokens.length,
        delivered: successCount,
        failed: allTokens.length - successCount
      });
    } catch (error) {
      routesLogger.error({ error }, "Error broadcasting notification");
      res.status(500).json({ error: 'Falha ao enviar broadcast' });
    }
  });

  // ============================================
  // History Routes
  // ============================================

  app.get('/api/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = historyQuerySchema.safeParse(req.query);
      const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

      const authReq = req as AuthenticatedRequest;
      const result = await getHistoryForUser(authReq.user.id, page, limit);
      
      res.json({
        services: result.services,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      routesLogger.error({ error }, "Error fetching history");
      res.status(500).json({ error: 'Falha ao buscar histórico' });
    }
  });

  app.post('/api/history', isAuthenticated, createResourceLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = createHistorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const entry = await addHistoryEntry(authReq.user.id, parsed.data);
      
      routesLogger.info({ userId: authReq.user.id, serviceId: entry.id }, "History entry created");
      res.status(201).json(entry);
    } catch (error) {
      routesLogger.error({ error }, "Error creating history entry");
      res.status(500).json({ error: 'Falha ao criar entrada no histórico' });
    }
  });

  app.patch('/api/history/:serviceId/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = updateHistoryStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const updated = await updateHistoryStatus(authReq.user.id, req.params.serviceId, parsed.data.status);
      
      if (!updated) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }
      
      routesLogger.info({ userId: authReq.user.id, serviceId: req.params.serviceId, status: parsed.data.status }, "History status updated");
      res.json(updated);
    } catch (error) {
      routesLogger.error({ error }, "Error updating history status");
      res.status(500).json({ error: 'Falha ao atualizar status' });
    }
  });

  // ============================================
  // Account Routes
  // ============================================

  app.get('/api/account', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const preferences = await getAccountPreferences(authReq.user.id);
      res.json({ user: authReq.user, preferences });
    } catch (error) {
      routesLogger.error({ error }, "Error fetching account");
      res.status(500).json({ error: 'Falha ao buscar conta' });
    }
  });

  app.put('/api/account/preferences', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = updatePreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
      }

      const authReq = req as AuthenticatedRequest;
      const preferences = await updateAccountPreferences(authReq.user.id, parsed.data);
      
      routesLogger.info({ userId: authReq.user.id }, "Account preferences updated");
      res.json({ preferences });
    } catch (error) {
      routesLogger.error({ error }, "Error updating preferences");
      res.status(500).json({ error: 'Falha ao atualizar preferências' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
