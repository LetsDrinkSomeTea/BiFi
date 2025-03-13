import 'dotenv/config';
import db from './db';
import {desc, eq, sql} from 'drizzle-orm';

// Import your table definitions from your DB schema
import {users, transactions, buyables} from '@shared/schema';
import { type User, type InsertUser, type Transaction, type Buyable } from '@shared/schema';
import { type Achievement } from '@shared/achievements';

// Define the storage interface (same as before)
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  updateUserAchievements(userId: number, achievements: Achievement[]): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  getTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  getBuyable(id: number): Promise<Buyable | undefined>;
  getAllBuyables(): Promise<Buyable[]>;
  createBuyable(buyable: Omit<Buyable, "id">): Promise<Buyable>;
  updateBuyable(id: number, updates: Partial<Buyable>): Promise<Buyable>;
  deleteBuyable(id: number): Promise<void>;
}

// Create a class implementing the IStorage interface using Drizzle
export class DrizzleStorage implements IStorage {
  private db = db;

  //------USER-------
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id));
    return result[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username));
    return result[0] as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
        .insert(users)
        .values({
          username: insertUser.username,
          password: insertUser.password,
          balance: 0,
          achievements: '[]',
          isAdmin: insertUser.isAdmin || false,
        })
        .returning();
    return user as User;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    await this.db
        .update(users)
        // Use a raw SQL expression to add the amount to the existing balance
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, userId));
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async updateUserAchievements(userId: number, achievements: Achievement[]): Promise<User> {
    await this.db
        .update(users)
        .set({ achievements: JSON.stringify(achievements) })
        .where(eq(users.id, userId));
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    await this.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    await this.db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId));
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result as User[];
  }

  //------Transaction-------

  async createTransaction(
      transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> {
    const [newTransaction] = await this.db
        .insert(transactions)
        .values({
          userId: transaction.userId,
          amount: transaction.amount,
          item: transaction.item || null,
          type: transaction.type,
          createdAt: new Date(),
        })
        .returning();
    return newTransaction as Transaction;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    const result = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));
    return result as Transaction[];
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const result = await this.db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt));
    return result as Transaction[];
  }

  //------Buyables-------
  async getBuyable(id: number): Promise<Buyable | undefined> {
    const result = await this.db
        .select()
        .from(buyables)
        .where(eq(buyables.id, id));
    return result[0] as Buyable | undefined;
  }

  async getAllBuyables(): Promise<Buyable[]> {
    const result = await this.db
        .select()
        .from(buyables);
    return result as Buyable[];
  }

  async createBuyable(buyable: Omit<Buyable, "id" | "stock" | "deleted">): Promise<Buyable> {
    const [newBuyable] = await this.db
        .insert(buyables)
        .values({
          name: buyable.name,
          price: buyable.price,
          category: buyable.category,
          stock: 0,
          deleted: false,
        })
        .returning();
    return newBuyable as Buyable;
  }


  async updateBuyable(id: number, updates: Partial<Buyable>): Promise<Buyable> {
    await this.db
        .update(buyables)
        .set(updates)
        .where(eq(buyables.id, id));
    const updatedBuyable = await this.getBuyable(id);
    if (!updatedBuyable) throw new Error("Buyable not found");
    return updatedBuyable;
  }

  async deleteBuyable(id: number): Promise<void> {
    await this.updateBuyable(id, { deleted: true });
  }

  async updateBuyableStock(id: number, amount: number): Promise<Buyable> {
    await this.db
        .update(buyables)
        .set({ stock: sql`${buyables.stock} + ${amount}` })
        .where(eq(buyables.id, id));
    const updatedBuyable = await this.getBuyable(id);
    if (!updatedBuyable) throw new Error("Buyable not found");
    return updatedBuyable;
  }
}


// Export an instance of your storage implementation.
export const storage = new DrizzleStorage();
