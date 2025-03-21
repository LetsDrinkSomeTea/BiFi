import 'dotenv/config';
import db from './db';
import {count, desc, eq, sql} from 'drizzle-orm';

// Import your table definitions from your DB schema
import {
  type Buyable,
  buyables,
  categoryIds, Group, GroupMember, groupMembers, groups,
  type InsertUser,
  type Transaction,
  transactions,
  type User,
  users, UserWithStatus
} from '@shared/schema';
import {type Achievement} from '@shared/achievements';
import {and} from "drizzle-orm/sql/expressions/conditions";

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
  deleteBuyable(id: number, restore:boolean): Promise<void>;
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

  async getUserMap(): Promise<Record<number, User>> {
    const users = await this.getAllUsers();
    return users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {} as Record<string, User>);
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
    const amount = parseFloat((transaction.amount).toFixed(2));
    const [newTransaction] = await this.db
        .insert(transactions)
        .values({
          userId: transaction.userId,
          amount,
          item: transaction.item || null,
          type: transaction.type,
          groupId: transaction.groupId || null,
          isJackpot: transaction.isJackpot || false,
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

  async getBuyablesMap(): Promise<Record<number, Buyable>> {
    const buyables = await storage.getAllBuyables();
    return buyables.reduce((map, buyable) => {
      map[buyable.id] = buyable;
      return map;
    }, {} as Record<string, Buyable>);
  }

  async getAllBuyables(): Promise<Buyable[]> {
    const result = await this.db
        .select()
        .from(buyables);
    return result as Buyable[];
  }

  async createBuyable(buyable: Omit<Buyable, "id" | "deleted">): Promise<Buyable> {
    if (buyable.category && !categoryIds.includes(buyable.category)) return Promise.reject(new Error("Invalid category"));
    const [newBuyable] = await this.db
        .insert(buyables)
        .values({
          name: buyable.name,
          price: buyable.price,
          category: buyable.category,
          stock: buyable.stock || 0,
          deleted: false,
        })
        .returning();
    return newBuyable as Buyable;
  }


  async updateBuyable(id: number, updates: Partial<Buyable>): Promise<Buyable> {
    if (updates.category && !categoryIds.includes(updates.category)) return Promise.reject(new Error("Invalid category"));
    await this.db
        .update(buyables)
        .set(updates)
        .where(eq(buyables.id, id));
    const updatedBuyable = await this.getBuyable(id);
    if (!updatedBuyable) throw new Error("Buyable not found");
    return updatedBuyable;
  }

  async deleteBuyable(id: number, restore: boolean = false): Promise<void> {
    await this.updateBuyable(id, { deleted: !restore });
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

  //------Groups------
  // Erstelle eine Gruppe
  async createGroup(name: string, userId: number): Promise<Group> {
    const [group] = await this.db
        .insert(groups)
        .values({ name })
        .returning();
    await this.db
        .insert(groupMembers)
        .values({ groupId: group.id, userId, status: "accepted" })
    return group as Group;
  }

  async getGroupMembers(groupId: number): Promise<User[]> {
    const results = await this.db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          balance: users.balance,
          isAdmin: users.isAdmin,
          achievements: users.achievements,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "accepted")));
    return results as User[];
  }

  async getGroupMembersAndInvitations(groupId: number): Promise<UserWithStatus[]> {
    const results = await this.db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          balance: users.balance,
          isAdmin: users.isAdmin,
          achievements: users.achievements,
          status: groupMembers.status,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, groupId));
    return results as UserWithStatus[];
  }

// Hole eine Gruppe anhand der Gruppen-ID
  async getGroup(groupId: number): Promise<Group[]> {
    const results = await this.db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId));
    return results as Group[];
  }

// Hole alle Gruppen, in denen der Nutzer als Mitglied (Status "accepted") ist
  async getGroups(userId: number): Promise<Group[]> {
    const results = await this.db
        .select({
          id: groups.id,
          name: groups.name,
        })
        .from(groupMembers)
        .innerJoin(groups, eq(groupMembers.groupId, groups.id))
        .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "accepted")));
    return results as Group[];
  }

  async isUserInGroup(userId: number, groupId: number): Promise<boolean> {
    const result = await this.db
        .select()
        .from(groupMembers)
        .where(
            and(
                and(
                    eq(groupMembers.groupId, groupId),
                    eq(groupMembers.userId, userId)),
                eq(groupMembers.status, "accepted")
            )
        );
    return result && result.length > 0;
  }

// Lade ein Mitglied in eine Gruppe ein (Einladung senden)
  async inviteUserToGroup(groupId: number, userId: number): Promise<GroupMember> {
    const [groupMember] = await this.db
        .insert(groupMembers)
        .values({ groupId, userId, status: "invited" })
        .returning();
    return groupMember as GroupMember;
  }

  // Hole alle Gruppen, in denen der Nutzer eine Einladung erhalten hat (Status "invited")
  async getInvitations(userId: number): Promise<Group[]> {
    const results = await this.db
        .select({
          id: groups.id,
          name: groups.name,
        })
        .from(groupMembers)
        .innerJoin(groups, eq(groupMembers.groupId, groups.id))
        .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "invited")))
    return results as Group[];
  }


// Einladung beantworten (annehmen oder ablehnen)
  async respondToInvitation(groupId: number, userId: number, response: "accepted" | "rejected"): Promise<GroupMember> {
    await this.db
        .update(groupMembers)
        .set({ status: response })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    // Rückgabe des aktualisierten Eintrags (optional)
    const [groupMember] = await this.db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    return groupMember as GroupMember;
  }

// Gruppe verlassen (Eintrag löschen)
  async leaveGroup(groupId: number, userId: number): Promise<void> {
    await this.db
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))

    // Überprüfen, ob die Gruppe noch Mitglieder hat und lösche sie, falls sie leer ist
    const remainingMembersCount = await this.db
        .select({count: count()})
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId))
        .then(([result]) => Number(result.count));

    if (remainingMembersCount === 0) {
      await this.db
          .delete(groups)
          .where(eq(groups.id, groupId));
    }
  }
}


// Export an instance of your storage implementation.
export const storage = new DrizzleStorage();
