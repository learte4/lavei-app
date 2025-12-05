import { randomUUID } from "crypto";

export type ServiceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface ServiceHistoryEntry {
  id: string;
  userId: string;
  vehicle: string;
  serviceType: string;
  address: string;
  scheduledFor: string;
  completedAt?: string | null;
  price: number;
  status: ServiceStatus;
  notes?: string | null;
}

type CreateHistoryEntry = Omit<ServiceHistoryEntry, "id" | "userId" | "status"> & {
  status?: ServiceStatus;
};

const historyByUser = new Map<string, ServiceHistoryEntry[]>();

function seedHistory(userId: string) {
  if (historyByUser.has(userId)) {
    return;
  }

  const now = new Date();
  const sample: ServiceHistoryEntry[] = [
    {
      id: randomUUID(),
      userId,
      vehicle: "Chevrolet Onix • ABC1D23",
      serviceType: "Higienização Completa",
      address: "Rua das Laranjeiras, 200 - São Paulo",
      scheduledFor: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      completedAt: null,
      price: 120,
      status: "scheduled",
      notes: "Cliente solicitou enceramento no final",
    },
    {
      id: randomUUID(),
      userId,
      vehicle: "Jeep Compass • DEF4G56",
      serviceType: "Lavagem Premium",
      address: "Av. Paulista, 1500 - São Paulo",
      scheduledFor: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      price: 180,
      status: "completed",
      notes: "Pagamento realizado via cartão",
    },
  ];

  historyByUser.set(userId, sample);
}

function ensureHistory(userId: string): ServiceHistoryEntry[] {
  seedHistory(userId);
  return historyByUser.get(userId)!;
}

export function getHistoryForUser(userId: string): ServiceHistoryEntry[] {
  return [...ensureHistory(userId)];
}

export function addHistoryEntry(userId: string, entry: CreateHistoryEntry): ServiceHistoryEntry {
  const newEntry: ServiceHistoryEntry = {
    id: randomUUID(),
    userId,
    status: entry.status ?? "scheduled",
    ...entry,
  };
  const history = [newEntry, ...ensureHistory(userId)];
  historyByUser.set(userId, history);
  return newEntry;
}

export function updateHistoryStatus(userId: string, serviceId: string, status: ServiceStatus): ServiceHistoryEntry | undefined {
  const history = [...ensureHistory(userId)];
  const index = history.findIndex((item) => item.id === serviceId);
  if (index === -1) {
    return undefined;
  }
  const updated: ServiceHistoryEntry = {
    ...history[index],
    status,
    completedAt: status === "completed" ? new Date().toISOString() : history[index].completedAt,
  };
  history[index] = updated;
  historyByUser.set(userId, history);
  return updated;
}

export function resetHistoryStore() {
  historyByUser.clear();
}
