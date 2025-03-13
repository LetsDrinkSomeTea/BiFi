import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
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

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  item: text("item").default(""),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const buyables = pgTable("buyables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
})

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Buyable = typeof buyables.$inferSelect;
