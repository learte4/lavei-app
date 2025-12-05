import {
  getAccountPreferences,
  resetAccountPreferences,
  updateAccountPreferences,
} from "../accountPreferences";

describe("accountPreferences", () => {
  beforeEach(() => {
    resetAccountPreferences();
  });

  it("returns default preferences for a new user", () => {
    const preferences = getAccountPreferences("user-123");
    expect(preferences.notificationsEnabled).toBe(true);
    expect(preferences.emailUpdates).toBe(true);
  });

  it("updates stored preferences", () => {
    updateAccountPreferences("user-123", {
      notificationsEnabled: false,
      preferredVehicle: "VW Nivus",
    });

    const preferences = getAccountPreferences("user-123");
    expect(preferences.notificationsEnabled).toBe(false);
    expect(preferences.preferredVehicle).toBe("VW Nivus");
  });
});
