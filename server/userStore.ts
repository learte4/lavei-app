import type { UpsertUser, User } from "../shared/schema";

export type CreateUserInput = Omit<UpsertUser, "id"> & { id?: string };
export type UpdateUserInput = Partial<Omit<UpsertUser, "id">>;

export interface IUserStore {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  findByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(id: string, updates: UpdateUserInput): Promise<User>;
}

let userStoreImpl: IUserStore;

if (process.env.DATABASE_URL) {
  const { DatabaseUserStore } = require("./userStore.db");
  userStoreImpl = new DatabaseUserStore();
} else {
  const { InMemoryUserStore } = require("./userStore.memory");
  userStoreImpl = new InMemoryUserStore();
}

export const userStore: IUserStore = userStoreImpl;
