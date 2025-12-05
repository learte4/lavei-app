import { randomUUID } from "crypto";
import type { ServiceHistory } from "../shared/schema";
import type { ServiceStatus } from "./validation";

// Re-export types for backward compatibility
export type { ServiceStatus };
export type ServiceHistoryEntry = ServiceHistory;

export interface IHistoryStore {
  getHistoryForUser(userId: string, page: number, limit: number): Promise<{ services: ServiceHistory[]; total: number }>;
  addHistoryEntry(userId: string, entry: CreateHistoryEntry): Promise<ServiceHistory>;
  updateHistoryStatus(userId: string, serviceId: string, status: ServiceStatus): Promise<ServiceHistory | undefined>;
  getServiceById(userId: string, serviceId: string): Promise<ServiceHistory | undefined>;
}

type CreateHistoryEntry = {
  vehicle: string;
  serviceType: string;
  address: string;
  scheduledFor: Date | string;
  price: number | string;
  notes?: string | null;
  status?: ServiceStatus;
};

// ============================================
// In-Memory Implementation (for dev/testing)
// ============================================

interface InMemoryEntry {
  id: string;
  userId: string;
  vehicle: string;
  serviceType: string;
  address: string;
  scheduledFor: Date;
  completedAt: Date | null;
  price: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const historyByUser = new Map<string, InMemoryEntry[]>();

function seedHistory(userId: string) {
  if (historyByUser.has(userId)) {
    return;
  }

  const now = new Date();
  const sample: InMemoryEntry[] = [
    {
      id: randomUUID(),
      userId,
      vehicle: "Chevrolet Onix • ABC1D23",
      serviceType: "Higienização Completa",
      address: "Rua das Laranjeiras, 200 - São Paulo",
      scheduledFor: new Date(now.getTime() + 60 * 60 * 1000),
      completedAt: null,
      price: "120.00",
      status: "scheduled",
      notes: "Cliente solicitou enceramento no final",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId,
      vehicle: "Jeep Compass • DEF4G56",
      serviceType: "Lavagem Premium",
      address: "Av. Paulista, 1500 - São Paulo",
      scheduledFor: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      price: "180.00",
      status: "completed",
      notes: "Pagamento realizado via cartão",
      createdAt: now,
      updatedAt: now,
    },
  ];

  historyByUser.set(userId, sample);
}

class InMemoryHistoryStore implements IHistoryStore {
  async getHistoryForUser(userId: string, page: number = 1, limit: number = 20): Promise<{ services: ServiceHistory[]; total: number }> {
    seedHistory(userId);
    const all = historyByUser.get(userId) || [];
    const offset = (page - 1) * limit;
    const services = all.slice(offset, offset + limit);
    return { services: services as unknown as ServiceHistory[], total: all.length };
  }

  async addHistoryEntry(userId: string, entry: CreateHistoryEntry): Promise<ServiceHistory> {
    seedHistory(userId);
    const now = new Date();
    const newEntry: InMemoryEntry = {
      id: randomUUID(),
      userId,
      vehicle: entry.vehicle,
      serviceType: entry.serviceType,
      address: entry.address,
      scheduledFor: typeof entry.scheduledFor === "string" ? new Date(entry.scheduledFor) : entry.scheduledFor,
      completedAt: null,
      price: String(entry.price),
      status: entry.status ?? "scheduled",
      notes: entry.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    const history = [newEntry, ...(historyByUser.get(userId) || [])];
    historyByUser.set(userId, history);
    return newEntry as unknown as ServiceHistory;
  }

  async updateHistoryStatus(userId: string, serviceId: string, status: ServiceStatus): Promise<ServiceHistory | undefined> {
    seedHistory(userId);
    const history = [...(historyByUser.get(userId) || [])];
    const index = history.findIndex((item) => item.id === serviceId);
    if (index === -1) {
      return undefined;
    }
    const updated: InMemoryEntry = {
      ...history[index],
      status,
      completedAt: status === "completed" ? new Date() : history[index].completedAt,
      updatedAt: new Date(),
    };
    history[index] = updated;
    historyByUser.set(userId, history);
    return updated as unknown as ServiceHistory;
  }

  async getServiceById(userId: string, serviceId: string): Promise<ServiceHistory | undefined> {
    seedHistory(userId);
    const history = historyByUser.get(userId) || [];
    const service = history.find((item) => item.id === serviceId);
    return service as unknown as ServiceHistory | undefined;
  }
}

export function resetHistoryStore() {
  historyByUser.clear();
}

// ============================================
// Store Factory
// ============================================

function createHistoryStore(): IHistoryStore {
  if (process.env.DATABASE_URL) {
    // Dynamic import only when DATABASE_URL is set
    const { DatabaseHistoryStore } = require("./historyStore.db");
    return new DatabaseHistoryStore();
  }
  return new InMemoryHistoryStore();
}

export const historyStore: IHistoryStore = createHistoryStore();

// Legacy exports for backward compatibility
export async function getHistoryForUser(userId: string, page = 1, limit = 20) {
  return historyStore.getHistoryForUser(userId, page, limit);
}

export async function addHistoryEntry(userId: string, entry: CreateHistoryEntry) {
  return historyStore.addHistoryEntry(userId, entry);
}

export async function updateHistoryStatus(userId: string, serviceId: string, status: ServiceStatus) {
  return historyStore.updateHistoryStatus(userId, serviceId, status);
}
