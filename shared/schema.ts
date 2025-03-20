import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real, primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  achievements: text("achievements").notNull().default("[]"),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export interface GroupWithUsers {
  id: number,
  name: string,
  members: User[],
}

export const groupMembers = pgTable("group_members", {
  groupId: integer("group_id").notNull().references(() => groups.id, {onDelete: 'cascade'}),
  userId: integer("user_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
  status: text("status").notNull().default("invited"),
}, (table) => [
    primaryKey({ columns: [table.groupId, table.userId]})
]);

export interface GroupStatus {
  id: string;
  displayName: string;
}

export const groupStatuses: GroupStatus[] =
    [
      {id: "invited", displayName: "Eingeladen"},
      {id: "accepted", displayName: "Angenommen"},
      {id: "rejected", displayName: "Abgelehnt"},
    ];

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  item: integer("item"),
  type: text("type").notNull(),
  groupId: integer("group_id"),
  isJackpot: boolean("is_jackpot").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const buyables = pgTable("buyables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  deleted: boolean("deleted").notNull().default(false),
})

export type BuyablesMap = Record<string, Buyable>;

export interface BuyableCategory {
  id: string;
  displayName: string;
}

export const categories: BuyableCategory[] =
    [
      {id: "alcohol", displayName: "Alkohol"},
      {id: "softdrink", displayName: "Softdrink"},
      {id: "food", displayName: "Essen"},
      {id: "snack", displayName: "Snacks"},
      {id: "other", displayName: "Sonstiges"},
    ];

export const categoryIds = categories.map((category) => category.id);
export const categoryMap = categories.reduce((map, category) => {
  map[category.id] = category.displayName;
  return map;
}, {} as Record<string, string>);

export const DAYS_OF_WEEK = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const DaysOfWeekMapToHumanReadable: Record<string, string> = {
  'Mo': 'Montag',
  'Di': 'Dienstag',
  'Mi': 'Mittwoch',
  'Do': 'Donnerstag',
  'Fr': 'Freitag',
  'Sa': 'Samstag',
  'So': 'Sonntag',
};

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export type LogInfo = {
  transaction: Transaction,
  user: User,
}[];

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Buyable = typeof buyables.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
