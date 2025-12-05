import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  roleSchema,
  registerSchema,
  loginSchema,
  expoPushTokenSchema,
  createHistorySchema,
  updateHistoryStatusSchema,
  updatePreferencesSchema,
} from "../validation";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse("user@example.com");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("user@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = emailSchema.safeParse("invalid-email");
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("normalizes email to lowercase", () => {
    const result = emailSchema.safeParse("USER@EXAMPLE.COM");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("user@example.com");
    }
  });
});

describe("passwordSchema", () => {
  it("accepts valid password with uppercase, lowercase, and number", () => {
    const result = passwordSchema.safeParse("Password123");
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Pass1");
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = passwordSchema.safeParse("password123");
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = passwordSchema.safeParse("PASSWORD123");
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = passwordSchema.safeParse("PasswordABC");
    expect(result.success).toBe(false);
  });
});

describe("roleSchema", () => {
  it("accepts valid roles", () => {
    expect(roleSchema.safeParse("client").success).toBe(true);
    expect(roleSchema.safeParse("provider").success).toBe(true);
    expect(roleSchema.safeParse("partner").success).toBe(true);
    expect(roleSchema.safeParse("admin").success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = roleSchema.safeParse("superuser");
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      role: "client",
    });
    expect(result.success).toBe(true);
  });

  it("uses default role if not provided", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("client");
    }
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("expoPushTokenSchema", () => {
  it("accepts valid ExponentPushToken", () => {
    const result = expoPushTokenSchema.safeParse("ExponentPushToken[abc123]");
    expect(result.success).toBe(true);
  });

  it("accepts valid ExpoPushToken", () => {
    const result = expoPushTokenSchema.safeParse("ExpoPushToken[xyz789]");
    expect(result.success).toBe(true);
  });

  it("rejects invalid token format", () => {
    const result = expoPushTokenSchema.safeParse("invalid-token");
    expect(result.success).toBe(false);
  });
});

describe("createHistorySchema", () => {
  it("accepts valid history entry", () => {
    const result = createHistorySchema.safeParse({
      vehicle: "Honda Civic",
      serviceType: "Lavagem Completa",
      address: "Rua Teste, 123",
      scheduledFor: new Date().toISOString(),
      price: 99.99,
      notes: "Observação",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = createHistorySchema.safeParse({
      vehicle: "Honda Civic",
      serviceType: "Lavagem Completa",
      address: "Rua Teste, 123",
      scheduledFor: new Date().toISOString(),
      price: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createHistorySchema.safeParse({
      vehicle: "Honda Civic",
      serviceType: "Lavagem Completa",
      address: "Rua Teste, 123",
      scheduledFor: "invalid-date",
      price: 99.99,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateHistoryStatusSchema", () => {
  it("accepts valid status", () => {
    expect(updateHistoryStatusSchema.safeParse({ status: "scheduled" }).success).toBe(true);
    expect(updateHistoryStatusSchema.safeParse({ status: "in_progress" }).success).toBe(true);
    expect(updateHistoryStatusSchema.safeParse({ status: "completed" }).success).toBe(true);
    expect(updateHistoryStatusSchema.safeParse({ status: "cancelled" }).success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateHistoryStatusSchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });
});

describe("updatePreferencesSchema", () => {
  it("accepts valid preferences update", () => {
    const result = updatePreferencesSchema.safeParse({
      notificationsEnabled: true,
      emailUpdates: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty update", () => {
    const result = updatePreferencesSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates paymentMethodLast4 format", () => {
    expect(updatePreferencesSchema.safeParse({ paymentMethodLast4: "1234" }).success).toBe(true);
    expect(updatePreferencesSchema.safeParse({ paymentMethodLast4: "12345" }).success).toBe(false);
    expect(updatePreferencesSchema.safeParse({ paymentMethodLast4: "abcd" }).success).toBe(false);
  });
});
