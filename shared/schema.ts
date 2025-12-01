import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
