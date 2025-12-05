export interface AccountPreferences {
  userId: string;
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  preferredVehicle?: string;
  paymentMethodLast4?: string;
}

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

export function getAccountPreferences(userId: string): AccountPreferences {
  if (!preferencesByUser.has(userId)) {
    preferencesByUser.set(userId, defaultPreferences(userId));
  }
  return preferencesByUser.get(userId)!;
}

export function updateAccountPreferences(
  userId: string,
  updates: Partial<Omit<AccountPreferences, "userId">>,
): AccountPreferences {
  const current = getAccountPreferences(userId);
  const next: AccountPreferences = {
    ...current,
    ...updates,
  };
  preferencesByUser.set(userId, next);
  return next;
}

export function resetAccountPreferences() {
  preferencesByUser.clear();
}
