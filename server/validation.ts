import { z } from "zod";

// ============================================
// Auth Schemas
// ============================================

export const emailSchema = z
  .string()
  .min(1, "Email é obrigatório")
  .email("Formato de email inválido")
  .max(255, "Email muito longo")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
  );

export const roleSchema = z.enum(["client", "provider", "partner", "admin"], {
  message: "Tipo de usuário inválido",
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  role: roleSchema.default("client"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

// ============================================
// Notification Schemas
// ============================================

export const expoPushTokenSchema = z
  .string()
  .refine(
    (token) =>
      token.startsWith("ExponentPushToken[") ||
      token.startsWith("ExpoPushToken["),
    "Formato de token Expo inválido"
  );

export const registerPushTokenSchema = z.object({
  expoPushToken: expoPushTokenSchema,
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  body: z.string().min(1, "Corpo é obrigatório").max(1000),
  data: z.record(z.string(), z.unknown()).optional(),
  targetUserId: z.string().uuid().optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  body: z.string().min(1, "Corpo é obrigatório").max(1000),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// History Schemas
// ============================================

export const serviceStatusSchema = z.enum(
  ["scheduled", "in_progress", "completed", "cancelled"],
  {
    message: "Status inválido",
  }
);

export const createHistorySchema = z.object({
  vehicle: z.string().min(1, "Veículo é obrigatório").max(200),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório").max(100),
  address: z.string().min(1, "Endereço é obrigatório").max(500),
  scheduledFor: z.string().datetime({ message: "Data inválida" }),
  price: z.number().positive("Preço deve ser positivo").finite(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateHistoryStatusSchema = z.object({
  status: serviceStatusSchema,
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// Account Preferences Schemas
// ============================================

export const updatePreferencesSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    emailUpdates: z.boolean().optional(),
    preferredVehicle: z.string().max(200).optional(),
    paymentMethodLast4: z
      .string()
      .length(4, "Deve ter exatamente 4 dígitos")
      .regex(/^\d{4}$/, "Deve conter apenas números")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type CreateHistoryInput = z.infer<typeof createHistorySchema>;
export type UpdateHistoryStatusInput = z.infer<typeof updateHistoryStatusSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type UserRole = z.infer<typeof roleSchema>;
