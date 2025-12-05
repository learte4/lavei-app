import type { AccountPreference } from "../shared/schema";

export interface AccountPreferences {
  userId: string;
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  preferredVehicle?: string | null;
  paymentMethodLast4?: string | null;
}

export interface IAccountPreferencesStore {
  getPreferences(userId: string): Promise<AccountPreferences>;
  updatePreferences(userId: string, updates: Partial<Omit<AccountPreferences, "userId">>): Promise<AccountPreferences>;
}

// ============================================
// In-Memory Implementation (for dev/testing)
// ============================================

const preferencesByUser = new Map<string, AccountPreferences>();

function defaultPreferences(userId: string): AccountPreferences {
  return {
    userId,
    notificationsEnabled: true,
    emailUpdates: true,
    preferredVehicle: "Chevrolet Onix • ABC1D23",
    paymentMethodLast4: "4242",
  };
}

class InMemoryAccountPreferencesStore implements IAccountPreferencesStore {
  async getPreferences(userId: string): Promise<AccountPreferences> {
    if (!preferencesByUser.has(userId)) {
      preferencesByUser.set(userId, defaultPreferences(userId));
    }
    return preferencesByUser.get(userId)!;
  }

  async updatePreferences(
    userId: string,
    updates: Partial<Omit<AccountPreferences, "userId">>
  ): Promise<AccountPreferences> {
    const current = await this.getPreferences(userId);
    const next: AccountPreferences = {
      ...current,
      ...updates,
    };
    preferencesByUser.set(userId, next);
    return next;
  }
}

export function resetAccountPreferences() {
  preferencesByUser.clear();
}

// ============================================
// Store Factory
// ============================================

function createPreferencesStore(): IAccountPreferencesStore {
  if (process.env.DATABASE_URL) {
    // Dynamic import only when DATABASE_URL is set
    const { DatabaseAccountPreferencesStore } = require("./accountPreferences.db");
    const dbStore = new DatabaseAccountPreferencesStore();
    
    return {
      async getPreferences(userId: string): Promise<AccountPreferences> {
        const prefs = await dbStore.getPreferences(userId);
        if (!prefs) {
          return defaultPreferences(userId);
        }
        return {
          userId: prefs.userId,
          notificationsEnabled: prefs.notificationsEnabled,
          emailUpdates: prefs.emailUpdates,
          preferredVehicle: prefs.preferredVehicle,
          paymentMethodLast4: prefs.paymentMethodLast4,
        };
      },
      async updatePreferences(
        userId: string,
        updates: Partial<Omit<AccountPreferences, "userId">>
      ): Promise<AccountPreferences> {
        const prefs = await dbStore.upsertPreferences(userId, updates);
        return {
          userId: prefs.userId,
          notificationsEnabled: prefs.notificationsEnabled,
          emailUpdates: prefs.emailUpdates,
          preferredVehicle: prefs.preferredVehicle,
          paymentMethodLast4: prefs.paymentMethodLast4,
        };
      },
    };
  }
  return new InMemoryAccountPreferencesStore();
}

export const preferencesStore: IAccountPreferencesStore = createPreferencesStore();

// Legacy exports for backward compatibility
export async function getAccountPreferences(userId: string): Promise<AccountPreferences> {
  return preferencesStore.getPreferences(userId);
}

export async function updateAccountPreferences(
  userId: string,
  updates: Partial<Omit<AccountPreferences, "userId">>
): Promise<AccountPreferences> {
  return preferencesStore.updatePreferences(userId, updates);
}
