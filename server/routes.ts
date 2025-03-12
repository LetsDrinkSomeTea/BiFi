import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { checkForNewAchievements } from "@shared/achievements";
import { calculateStatistics } from "@shared/statistics/utils";

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
      const userAchievements = JSON.parse(user.achievements!);

      const newAchievements = checkForNewAchievements({
        user: {
          balance: user.balance,
          achievements: userAchievements
        },
        transactions,
        currentTransaction: transaction
      });

      if (newAchievements.length > 0) {
        const updatedAchievements = [...userAchievements, ...newAchievements];
        await storage.updateUserAchievements(userId, updatedAchievements);
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

      // Create deposit transaction
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: "DEPOSIT"
      });

      // Update user balance
      const user = await storage.updateUserBalance(userId, amount);

      // Check for new achievements
      const transactions = await storage.getTransactions(userId);
      const userAchievements = JSON.parse(user.achievements);

      const newAchievements = checkForNewAchievements({
        user: {
          balance: user.balance,
          achievements: userAchievements
        },
        transactions,
        currentTransaction: transaction
      });

      if (newAchievements.length > 0) {
        const updatedAchievements = [...userAchievements, ...newAchievements];
        await storage.updateUserAchievements(userId, updatedAchievements);
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

  // New Statistics Routes
  app.get("/api/stats/system", async (req, res) => {
    try {
      requireAuth(req);
      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 7); // Default to 7 days

      if (req.query.days) {
        start.setDate(end.getDate() - parseInt(req.query.days as string));
      }

      const transactions = await storage.getAllTransactions();
      const users = await storage.getAllUsers();

      const stats = calculateStatistics(users, transactions, {
        timeRange: { start, end }
      });

      res.json(stats);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/stats/user/:userId", async (req, res) => {
    try {
      requireAuth(req);
      // Users can only access their own statistics
      if (parseInt(req.params.userId) !== req.user!.id) {
        throw new Error("Forbidden");
      }

      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 7); // Default to 7 days

      if (req.query.days) {
        start.setDate(end.getDate() - parseInt(req.query.days as string));
      }

      const user = await storage.getUser(parseInt(req.params.userId));
      const transactions = await storage.getTransactions(parseInt(req.params.userId));

      const stats = calculateStatistics([user!], transactions, {
        timeRange: { start, end },
        userIds: [parseInt(req.params.userId)]
      });

      res.json(stats);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}