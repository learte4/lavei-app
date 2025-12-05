import rateLimit from "express-rate-limit";
import { createChildLogger } from "./logger";

const logger = createChildLogger("rate-limiter");

// Configuração base para Replit (trust proxy)
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // Replit usa proxy reverso - desabilita validações que não se aplicam
  validate: { 
    xForwardedForHeader: false,
  },
};

// Config para limiters com keyGenerator customizado (usa userId)
const userKeyConfig = {
  ...baseConfig,
  validate: {
    ...baseConfig.validate,
    // Desabilita warning de IPv6 para keyGenerators que usam userId
    keyGeneratorIpFallback: false,
  },
};

/**
 * Rate limiter geral para todas as rotas da API
 * 100 requests por minuto por IP
 */
export const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000, // 1 minuto
  limit: 100,
  message: {
    error: "Muitas requisições. Tente novamente em alguns segundos.",
    retryAfter: 60,
  },
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip, path: req.path }, "Rate limit exceeded (general)");
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter para rotas de autenticação (login/register)
 * 5 tentativas por 15 minutos por IP
 */
export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    retryAfter: 900,
  },
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip, email: req.body?.email }, "Rate limit exceeded (auth)");
    res.status(options.statusCode).json(options.message);
  },
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

/**
 * Rate limiter para envio de notificações
 * 10 notificações por minuto por usuário
 */
export const notificationLimiter = rateLimit({
  ...userKeyConfig,
  windowMs: 60 * 1000, // 1 minuto
  limit: 10,
  message: {
    error: "Limite de notificações atingido. Tente novamente em 1 minuto.",
    retryAfter: 60,
  },
  keyGenerator: (req) => {
    // Usa o ID do usuário autenticado como chave
    return (req as any).user?.id || req.ip || "anonymous";
  },
  handler: (req, res, next, options) => {
    logger.warn({ userId: (req as any).user?.id }, "Rate limit exceeded (notifications)");
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter para broadcast (apenas admins, mas ainda limitado)
 * 5 broadcasts por hora
 */
export const broadcastLimiter = rateLimit({
  ...userKeyConfig,
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5,
  message: {
    error: "Limite de broadcasts atingido. Tente novamente em 1 hora.",
    retryAfter: 3600,
  },
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || "anonymous";
  },
  handler: (req, res, next, options) => {
    logger.warn({ userId: (req as any).user?.id }, "Rate limit exceeded (broadcast)");
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter para criação de recursos (history, etc)
 * 30 criações por minuto
 */
export const createResourceLimiter = rateLimit({
  ...userKeyConfig,
  windowMs: 60 * 1000, // 1 minuto
  limit: 30,
  message: {
    error: "Muitas criações. Tente novamente em alguns segundos.",
    retryAfter: 60,
  },
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || "anonymous";
  },
});
