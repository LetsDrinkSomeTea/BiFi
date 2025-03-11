import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { achievementsList } from "@shared/schema";

function requireAuth(req: Request) {
  if (!req.isAuthenticated()) {
    throw new Error("Unauthorized");
  }
}

function requireAdmin(req: Request) {
  requireAuth(req);
  if (!req.user?.isAdmin) {
    throw new Error("Forbidden");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/purchase", async (req, res) => {
    try {
      requireAuth(req);
      const userId = req.user!.id;
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        amount: -1,
        type: "PURCHASE"
      });

      // Update balance
      const user = await storage.updateUserBalance(userId, -1);

      // Check and update achievements
      const transactions = await storage.getTransactions(userId);
      const userAchievements = JSON.parse(user.achievements) as typeof achievementsList;
      
      const newAchievements = [...userAchievements];
      const now = new Date().toISOString();

      if (!userAchievements.find(a => a.id === "first_purchase")) {
        newAchievements.push({ ...achievementsList[0], unlockedAt: now });
      }

      if (transactions.length >= 10 && !userAchievements.find(a => a.id === "regular_customer")) {
        newAchievements.push({ ...achievementsList[1], unlockedAt: now });
      }

      if (user.balance <= -10 && !userAchievements.find(a => a.id === "big_spender")) {
        newAchievements.push({ ...achievementsList[2], unlockedAt: now });
      }

      if (newAchievements.length > userAchievements.length) {
        await storage.updateUserAchievements(userId, newAchievements);
      }

      res.json({ transaction, user });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      requireAuth(req);
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      requireAdmin(req);
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
