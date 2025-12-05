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

  it("seeds default entries for a new user", () => {
    const history = getHistoryForUser("user-1");
    expect(history.length).toBeGreaterThan(0);
  });

  it("adds a new entry to the top of the history", () => {
    const initialHistory = getHistoryForUser("user-1");
    const entry = addHistoryEntry("user-1", {
      vehicle: "Tesla Model 3 • XYZ1A23",
      serviceType: "Lavagem express",
      address: "Rua Teste, 123",
      scheduledFor: new Date().toISOString(),
      price: 99,
      notes: "Testando inserção",
      completedAt: null,
    });

    const updatedHistory = getHistoryForUser("user-1");
    expect(updatedHistory[0].id).toEqual(entry.id);
    expect(updatedHistory.length).toBe(initialHistory.length + 1);
  });

  it("updates the status of an existing entry", () => {
    const [first] = getHistoryForUser("user-1");
    const updated = updateHistoryStatus("user-1", first.id, "completed");

    expect(updated?.status).toBe("completed");
    expect(updated?.completedAt).toBeTruthy();
  });
});
