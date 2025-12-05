import { describe, it, expect, beforeEach } from "vitest";
import {
  getAccountPreferences,
  resetAccountPreferences,
  updateAccountPreferences,
} from "../accountPreferences";

describe("accountPreferences", () => {
  beforeEach(() => {
    resetAccountPreferences();
  });

  it("returns default preferences for a new user", async () => {
    const preferences = await getAccountPreferences("user-123");
    expect(preferences.notificationsEnabled).toBe(true);
    expect(preferences.emailUpdates).toBe(true);
  });

  it("updates stored preferences", async () => {
    await updateAccountPreferences("user-123", {
      notificationsEnabled: false,
      preferredVehicle: "VW Nivus",
    });

    const preferences = await getAccountPreferences("user-123");
    expect(preferences.notificationsEnabled).toBe(false);
    expect(preferences.preferredVehicle).toBe("VW Nivus");
  });

  it("preserves existing preferences when updating", async () => {
    await updateAccountPreferences("user-123", {
      notificationsEnabled: false,
    });

    await updateAccountPreferences("user-123", {
      preferredVehicle: "Honda Civic",
    });

    const preferences = await getAccountPreferences("user-123");
    expect(preferences.notificationsEnabled).toBe(false);
    expect(preferences.preferredVehicle).toBe("Honda Civic");
  });
});
