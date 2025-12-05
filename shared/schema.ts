import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  googleId: varchar("google_id").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("client").notNull(), // 'client' | 'provider' | 'partner' | 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushTokens = pgTable("push_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  expoPushToken: varchar("expo_push_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_push_tokens_user").on(table.userId),
  uniqueIndex("IDX_push_tokens_unique").on(table.userId, table.expoPushToken)
]);

export const serviceHistory = pgTable("service_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  vehicle: varchar("vehicle", { length: 200 }).notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_service_history_user").on(table.userId),
  index("IDX_service_history_status").on(table.status),
  index("IDX_service_history_scheduled").on(table.scheduledFor),
]);

export const accountPreferences = pgTable("account_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  emailUpdates: boolean("email_updates").default(true).notNull(),
  preferredVehicle: varchar("preferred_vehicle", { length: 200 }),
  paymentMethodLast4: varchar("payment_method_last4", { length: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_account_preferences_user").on(table.userId),
]);

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type ServiceHistory = typeof serviceHistory.$inferSelect;
export type InsertServiceHistory = typeof serviceHistory.$inferInsert;
export type AccountPreference = typeof accountPreferences.$inferSelect;
export type InsertAccountPreference = typeof accountPreferences.$inferInsert;
