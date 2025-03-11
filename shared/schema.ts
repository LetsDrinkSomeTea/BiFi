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
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Purchased a drink before 9 AM"
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Purchased a drink after 10 PM"
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Purchased drinks on 3 consecutive weekends"
  },
  {
    id: "responsible_drinker",
    name: "Responsible Drinker",
    description: "Deposit money before your balance goes negative"
  },
  {
    id: "marathon_session",
    name: "Marathon Session",
    description: "Purchased 5 drinks in a single day"
  },
  {
    id: "loyal_customer",
    name: "Loyal Customer",
    description: "Used the system for over 30 days"
  },
  {
    id: "positive_balance",
    name: "In The Black",
    description: "Maintained a positive balance for 2 weeks"
  }
];
