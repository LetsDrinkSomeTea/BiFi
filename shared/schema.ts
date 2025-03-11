import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  achievements: text("achievements").notNull().default('[]')
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt: string | null;
};

export const achievementsList: Omit<Achievement, "unlockedAt">[] = [
  {
    id: "first_purchase",
    name: "First Purchase",
    description: "Made your first drink purchase"
  },
  {
    id: "regular_customer",
    name: "Regular Customer",
    description: "Purchased 10 or more drinks"
  },
  {
    id: "big_spender",
    name: "Big Spender",
    description: "Balance went below -€10"
  }
];
