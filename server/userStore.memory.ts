import { randomUUID } from "crypto";
import type { User } from "../shared/schema";
import type { CreateUserInput, IUserStore, UpdateUserInput } from "./userStore";

export class InMemoryUserStore implements IUserStore {
  private users = new Map<string, User>();
  private emailIndex = new Map<string, string>();
  private googleIndex = new Map<string, string>();

  private normalize(value?: string | null) {
    return value?.toLowerCase().trim();
  }

  private trackUser(user: User) {
    const normalizedEmail = this.normalize(user.email);
    if (normalizedEmail) {
      this.emailIndex.set(normalizedEmail, user.id);
    }
    const normalizedGoogleId = this.normalize(user.googleId);
    if (normalizedGoogleId) {
      this.googleIndex.set(normalizedGoogleId, user.id);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const id = this.emailIndex.get(this.normalize(email) || "");
    return id ? this.users.get(id) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    const id = this.googleIndex.get(this.normalize(googleId) || "");
    return id ? this.users.get(id) : undefined;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const now = new Date();
    const id = data.id ?? randomUUID();
    const user: User = {
      id,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImageUrl: data.profileImageUrl,
      googleId: data.googleId,
      role: data.role ?? "client",
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    this.trackUser(user);
    return user;
  }

  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    const next: User = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, next);

    if (updates.email && updates.email !== existing.email) {
      const normalizedOldEmail = this.normalize(existing.email);
      if (normalizedOldEmail) {
        this.emailIndex.delete(normalizedOldEmail);
      }
    }

    if (updates.googleId && updates.googleId !== existing.googleId) {
      const normalizedOldGoogleId = this.normalize(existing.googleId);
      if (normalizedOldGoogleId) {
        this.googleIndex.delete(normalizedOldGoogleId);
      }
    }

    this.trackUser(next);
    return next;
  }
}
