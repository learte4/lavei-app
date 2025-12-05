import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { serviceHistory, type ServiceHistory, type InsertServiceHistory } from "../shared/schema";
import type { ServiceStatus } from "./validation";

export interface IHistoryStore {
  getHistoryForUser(userId: string, page: number, limit: number): Promise<{ services: ServiceHistory[]; total: number }>;
  addHistoryEntry(userId: string, entry: Omit<InsertServiceHistory, "id" | "userId" | "createdAt" | "updatedAt">): Promise<ServiceHistory>;
  updateHistoryStatus(userId: string, serviceId: string, status: ServiceStatus): Promise<ServiceHistory | undefined>;
  getServiceById(userId: string, serviceId: string): Promise<ServiceHistory | undefined>;
}

export class DatabaseHistoryStore implements IHistoryStore {
  async getHistoryForUser(userId: string, page: number = 1, limit: number = 20): Promise<{ services: ServiceHistory[]; total: number }> {
    const offset = (page - 1) * limit;

    const [services, countResult] = await Promise.all([
      db
        .select()
        .from(serviceHistory)
        .where(eq(serviceHistory.userId, userId))
        .orderBy(desc(serviceHistory.scheduledFor))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceHistory)
        .where(eq(serviceHistory.userId, userId)),
    ]);

    return {
      services,
      total: countResult[0]?.count ?? 0,
    };
  }

  async addHistoryEntry(
    userId: string,
    entry: Omit<InsertServiceHistory, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ServiceHistory> {
    const [newEntry] = await db
      .insert(serviceHistory)
      .values({
        ...entry,
        userId,
        price: String(entry.price),
      })
      .returning();

    return newEntry;
  }

  async updateHistoryStatus(
    userId: string,
    serviceId: string,
    status: ServiceStatus
  ): Promise<ServiceHistory | undefined> {
    const completedAt = status === "completed" ? new Date() : undefined;

    const [updated] = await db
      .update(serviceHistory)
      .set({
        status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(serviceHistory.id, serviceId), eq(serviceHistory.userId, userId)))
      .returning();

    return updated;
  }

  async getServiceById(userId: string, serviceId: string): Promise<ServiceHistory | undefined> {
    const [service] = await db
      .select()
      .from(serviceHistory)
      .where(and(eq(serviceHistory.id, serviceId), eq(serviceHistory.userId, userId)));

    return service;
  }
}
