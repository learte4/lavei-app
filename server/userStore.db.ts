import { eq } from "drizzle-orm";
import { users, type User } from "../shared/schema";
import { db } from "./db";
import type { CreateUserInput, IUserStore, UpdateUserInput } from "./userStore";

export class DatabaseUserStore implements IUserStore {
  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return user;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
