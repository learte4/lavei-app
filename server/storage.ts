import { users, pushTokens, type User, type UpsertUser, type PushToken } from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  savePushToken(userId: string, expoPushToken: string): Promise<PushToken>;
  getPushTokensForUser(userId: string): Promise<PushToken[]>;
  getAllPushTokens(): Promise<PushToken[]>;
  removePushToken(expoPushToken: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async savePushToken(userId: string, expoPushToken: string): Promise<PushToken> {
    const existing = await db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.expoPushToken, expoPushToken)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(pushTokens)
        .set({ updatedAt: new Date() })
        .where(eq(pushTokens.id, existing[0].id))
        .returning();
      return updated;
    }

    const [token] = await db
      .insert(pushTokens)
      .values({ userId, expoPushToken })
      .returning();
    return token;
  }

  async getPushTokensForUser(userId: string): Promise<PushToken[]> {
    return db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  }

  async getAllPushTokens(): Promise<PushToken[]> {
    return db.select().from(pushTokens);
  }

  async removePushToken(expoPushToken: string): Promise<void> {
    await db.delete(pushTokens).where(eq(pushTokens.expoPushToken, expoPushToken));
  }
}

export const storage = new DatabaseStorage();
