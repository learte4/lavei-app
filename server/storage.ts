import { type User, type UpsertUser, type PushToken } from "../shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  savePushToken(userId: string, expoPushToken: string): Promise<PushToken>;
  getPushTokensForUser(userId: string): Promise<PushToken[]>;
  getAllPushTokens(): Promise<PushToken[]>;
  removePushToken(expoPushToken: string): Promise<void>;
}

class MemoryStorage implements IStorage {
  users: Map<string, User> = new Map();
  tokens: PushToken[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id);
    const now = new Date();
    const next: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    } as User;
    this.users.set(userData.id, next);
    return next;
  }

  async savePushToken(userId: string, expoPushToken: string): Promise<PushToken> {
    const existing = this.tokens.find(t => t.userId === userId && t.expoPushToken === expoPushToken);
    const now = new Date();
    if (existing) {
      existing.updatedAt = now;
      return existing;
    }
    const token: PushToken = {
      id: Math.random().toString(36).slice(2),
      userId,
      expoPushToken,
      createdAt: now,
      updatedAt: now,
    } as PushToken;
    this.tokens.push(token);
    return token;
  }

  async getPushTokensForUser(userId: string): Promise<PushToken[]> {
    return this.tokens.filter(t => t.userId === userId);
  }

  async getAllPushTokens(): Promise<PushToken[]> {
    return this.tokens;
  }

  async removePushToken(expoPushToken: string): Promise<void> {
    this.tokens = this.tokens.filter(t => t.expoPushToken !== expoPushToken);
  }
}

let storageImpl: IStorage;

if (process.env.DATABASE_URL) {
  const { DatabaseStorage } = require("./storage.db");
  storageImpl = new DatabaseStorage();
} else {
  storageImpl = new MemoryStorage();
}

export const storage: IStorage = storageImpl;
