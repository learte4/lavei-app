import { eq } from "drizzle-orm";
import { db } from "./db";
import { accountPreferences, type AccountPreference, type InsertAccountPreference } from "../shared/schema";

export interface IAccountPreferencesStore {
  getPreferences(userId: string): Promise<AccountPreference | undefined>;
  upsertPreferences(userId: string, updates: Partial<Omit<InsertAccountPreference, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<AccountPreference>;
}

export class DatabaseAccountPreferencesStore implements IAccountPreferencesStore {
  async getPreferences(userId: string): Promise<AccountPreference | undefined> {
    const [prefs] = await db
      .select()
      .from(accountPreferences)
      .where(eq(accountPreferences.userId, userId));

    return prefs;
  }

  async upsertPreferences(
    userId: string,
    updates: Partial<Omit<InsertAccountPreference, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<AccountPreference> {
    const existing = await this.getPreferences(userId);

    if (existing) {
      const [updated] = await db
        .update(accountPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(accountPreferences.userId, userId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(accountPreferences)
      .values({
        userId,
        notificationsEnabled: updates.notificationsEnabled ?? true,
        emailUpdates: updates.emailUpdates ?? true,
        preferredVehicle: updates.preferredVehicle,
        paymentMethodLast4: updates.paymentMethodLast4,
      })
      .returning();

    return created;
  }
}
