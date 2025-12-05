import { describe, it, expect, beforeEach } from "vitest";
import {
  addHistoryEntry,
  getHistoryForUser,
  resetHistoryStore,
  updateHistoryStatus,
} from "../historyStore";

describe("historyStore", () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it("seeds default entries for a new user", async () => {
    const result = await getHistoryForUser("user-1");
    expect(result.services.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("adds a new entry to the top of the history", async () => {
    const initialResult = await getHistoryForUser("user-1");
    const entry = await addHistoryEntry("user-1", {
      vehicle: "Tesla Model 3 • XYZ1A23",
      serviceType: "Lavagem express",
      address: "Rua Teste, 123",
      scheduledFor: new Date().toISOString(),
      price: 99,
      notes: "Testando inserção",
    });

    const updatedResult = await getHistoryForUser("user-1");
    expect(updatedResult.services[0].id).toEqual(entry.id);
    expect(updatedResult.total).toBe(initialResult.total + 1);
  });

  it("updates the status of an existing entry", async () => {
    const result = await getHistoryForUser("user-1");
    const first = result.services[0];
    const updated = await updateHistoryStatus("user-1", first.id, "completed");

    expect(updated?.status).toBe("completed");
    expect(updated?.completedAt).toBeTruthy();
  });

  it("supports pagination", async () => {
    const page1 = await getHistoryForUser("user-1", 1, 1);
    const page2 = await getHistoryForUser("user-1", 2, 1);

    expect(page1.services.length).toBe(1);
    expect(page2.services.length).toBeLessThanOrEqual(1);
    
    if (page2.services.length > 0) {
      expect(page1.services[0].id).not.toBe(page2.services[0].id);
    }
  });

  it("returns undefined when updating non-existent entry", async () => {
    const updated = await updateHistoryStatus("user-1", "non-existent-id", "completed");
    expect(updated).toBeUndefined();
  });
});
