import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
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
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay();

      // Basic achievements
      if (!userAchievements.find(a => a.id === "first_purchase")) {
        newAchievements.push({ ...achievementsList[0], unlockedAt: now });
      }

      if (transactions.length >= 10 && !userAchievements.find(a => a.id === "regular_customer")) {
        newAchievements.push({ ...achievementsList[1], unlockedAt: now });
      }

      if (user.balance <= -10 && !userAchievements.find(a => a.id === "big_spender")) {
        newAchievements.push({ ...achievementsList[2], unlockedAt: now });
      }
      
      // Time-based achievements
      if (currentHour < 9 && !userAchievements.find(a => a.id === "early_bird")) {
        newAchievements.push({ ...achievementsList[3], unlockedAt: now });
      }
      
      if (currentHour >= 22 && !userAchievements.find(a => a.id === "night_owl")) {
        newAchievements.push({ ...achievementsList[4], unlockedAt: now });
      }
      
      // Frequency-based achievement
      const todayTransactions = transactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate.toDateString() === new Date().toDateString() && t.type === "PURCHASE";
      });
      
      if (todayTransactions.length >= 5 && !userAchievements.find(a => a.id === "marathon_session")) {
        newAchievements.push({ ...achievementsList[7], unlockedAt: now });
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

  // New Admin Routes
  app.post("/api/admin/deposit", async (req, res) => {
    try {
      requireAdmin(req);
      const { userId, amount } = req.body;

      // Get user before update
      const userBefore = await storage.getUser(userId);
      
      // Create deposit transaction
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: "DEPOSIT"
      });

      // Update user balance
      const user = await storage.updateUserBalance(userId, amount);
      
      // Check for Responsible Drinker achievement
      if (userBefore && userBefore.balance > 0 && !JSON.parse(userBefore.achievements).find((a: any) => a.id === "responsible_drinker")) {
        const userAchievements = JSON.parse(user.achievements);
        const newAchievements = [...userAchievements];
        const now = new Date().toISOString();
        
        newAchievements.push({ 
          ...achievementsList.find(a => a.id === "responsible_drinker"), 
          unlockedAt: now 
        });
        
        await storage.updateUserAchievements(userId, newAchievements);
      }

      res.json({ transaction, user });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      requireAdmin(req);
      const { userId, newPassword } = req.body;
      const user = await storage.updateUserPassword(userId, await hashPassword(newPassword));
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      requireAdmin(req);
      await storage.deleteUser(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      requireAdmin(req);
      const { isAdmin } = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), { isAdmin });
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // User password change route
  app.post("/api/change-password", async (req, res) => {
    try {
      requireAuth(req);
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password
      const updatedUser = await storage.updateUserPassword(user.id, await hashPassword(newPassword));
      res.json(updatedUser);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}