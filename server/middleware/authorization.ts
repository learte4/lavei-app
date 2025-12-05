import { RequestHandler } from "express";
import { createChildLogger } from "../logger";

const logger = createChildLogger("authorization");

export type UserRole = "client" | "provider" | "partner" | "admin";

/**
 * Middleware que verifica se o usuário tem uma das roles permitidas
 */
export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      logger.warn({ path: req.path }, "Acesso negado: usuário não autenticado");
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      logger.warn(
        { userId: user.id, role: user.role, requiredRoles: allowedRoles },
        "Acesso negado: permissão insuficiente"
      );
      return res.status(403).json({ message: "Permissão insuficiente" });
    }

    return next();
  };
};

/**
 * Middleware que verifica se o usuário é admin
 */
export const requireAdmin: RequestHandler = requireRole("admin");

/**
 * Middleware que verifica se o usuário é admin ou partner
 */
export const requireAdminOrPartner: RequestHandler = requireRole("admin", "partner");

/**
 * Middleware que verifica se o usuário é provider
 */
export const requireProvider: RequestHandler = requireRole("provider", "partner", "admin");
