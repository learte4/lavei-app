import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import type { AccountPreferences } from "./accountPreferences";
import {
  addHistoryEntry,
  getHistoryForUser,
  ServiceStatus,
  updateHistoryStatus,
} from "./historyStore";
import {
  getAccountPreferences,
  updateAccountPreferences,
} from "./accountPreferences";

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

  app.post('/api/notifications/register', isAuthenticated, async (req: any, res) => {
    try {
      const { expoPushToken } = req.body;
      if (!expoPushToken) {
        return res.status(400).json({ error: 'Missing expoPushToken' });
      }

      if (!expoPushToken.startsWith('ExponentPushToken[') && !expoPushToken.startsWith('ExpoPushToken[')) {
        return res.status(400).json({ error: 'Invalid Expo push token format' });
      }

      const userId = req.user.id;
      const token = await storage.savePushToken(userId, expoPushToken);
      console.log(`Registered push token for user ${userId}: ${expoPushToken}`);
      res.json({ success: true, tokenId: token.id });
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({ error: 'Failed to register push token' });
    }
  });

  app.post('/api/notifications/send', isAuthenticated, async (req: any, res) => {
    try {
      const { title, body, data, targetUserId } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Missing title or body' });
      }

      let tokens;
      if (targetUserId) {
        tokens = await storage.getPushTokensForUser(targetUserId);
      } else {
        const userId = req.user.id;
        tokens = await storage.getPushTokensForUser(userId);
      }

      if (tokens.length === 0) {
        return res.status(404).json({ error: 'No push tokens found' });
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
      console.error('Error sending push notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.post('/api/notifications/broadcast', isAuthenticated, async (req: any, res) => {
    try {
      const { title, body, data } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Missing title or body' });
      }

      const allTokens = await storage.getAllPushTokens();

      if (allTokens.length === 0) {
        return res.status(404).json({ error: 'No push tokens registered' });
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

      res.json({ 
        success: true, 
        sentTo: allTokens.length,
        delivered: successCount,
        failed: allTokens.length - successCount
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      res.status(500).json({ error: 'Failed to broadcast notification' });
    }
  });

  app.get('/api/history', isAuthenticated, (req: any, res) => {
    const services = getHistoryForUser(req.user.id);
    res.json({ services });
  });

  app.post('/api/history', isAuthenticated, (req: any, res) => {
    const { vehicle, serviceType, address, scheduledFor, price, notes } = req.body;
    if (!vehicle || !serviceType || !address || !scheduledFor || typeof price === 'undefined') {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    }
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'Preço inválido' });
    }
    const entry = addHistoryEntry(req.user.id, {
      vehicle,
      serviceType,
      address,
      scheduledFor,
      price: parsedPrice,
      notes,
      completedAt: null,
    });
    res.status(201).json(entry);
  });

  app.patch('/api/history/:serviceId/status', isAuthenticated, (req: any, res) => {
    const validStatuses: ServiceStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    const status = req.body.status as ServiceStatus;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    const updated = updateHistoryStatus(req.user.id, req.params.serviceId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.json(updated);
  });

  app.get('/api/account', isAuthenticated, (req: any, res) => {
    const preferences = getAccountPreferences(req.user.id);
    res.json({ user: req.user, preferences });
  });

  app.put('/api/account/preferences', isAuthenticated, (req: any, res) => {
    const updates: Partial<Omit<AccountPreferences, 'userId'>> = {};
    if (typeof req.body.notificationsEnabled === 'boolean') {
      updates.notificationsEnabled = req.body.notificationsEnabled;
    }
    if (typeof req.body.emailUpdates === 'boolean') {
      updates.emailUpdates = req.body.emailUpdates;
    }
    if (typeof req.body.preferredVehicle === 'string') {
      updates.preferredVehicle = req.body.preferredVehicle;
    }
    if (typeof req.body.paymentMethodLast4 === 'string') {
      updates.paymentMethodLast4 = req.body.paymentMethodLast4;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido informado' });
    }

    const preferences = updateAccountPreferences(req.user.id, updates);
    res.json({ preferences });
  });

  const httpServer = createServer(app);
  return httpServer;
}
