import type {Express, Request} from "express";
import {createServer, type Server} from "http";
import {comparePasswords, hashPassword, setupAuth} from "./auth";
import {storage} from "./storage";
import {Achievement, achievements, checkForNewAchievements} from "@shared/achievements";
import {calculateStatistics} from "@shared/statistics/utils";
import {Buyable, GroupWithUsers, LogInfo, Transaction, User} from '@shared/schema.ts'
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
async function requireGroupmember(req: Request, groupId:number) {
  requireAuth(req);
  if (isNaN(groupId)) throw new Error("Ungültige Gruppen-ID");
  if(!await storage.isUserInGroup(req.user!.id, groupId)){
    throw new Error("Forbidden");
  }
}

async function purchase(userId: number, buyableId: number, multiplier: number, groupId: number | null = null, isJackpot: boolean = false) : Promise< {transaction: Transaction, user: User}> {
  const buyables = await storage.getAllBuyables();
  const buyablesMap = buyables.reduce<Record<number, Buyable>>((acc, buyable) => {
    acc[buyable.id] = buyable;
    return acc;
  }, {});

  const buyable = await storage.getBuyable(buyableId);
  if (!buyable) {throw new Error("Buyable not found")}

  // Create transaction
  const transaction = await storage.createTransaction({
    userId,
    amount: -buyable!.price*multiplier,
    item: buyable!.id,
    type: "PURCHASE",
    groupId: groupId,
    isJackpot: isJackpot
  });

  // Update balance
  const user = await storage.updateUserBalance(userId, transaction.amount);
  if(groupId === null) {
    await storage.updateBuyableStock(buyableId, -1);
  }

  // Check and update achievements
  const transactions = await storage.getTransactions(userId);
  const userAchievements = JSON.parse(user.achievements!);

  const newAchievements = checkForNewAchievements({
    user: {
      balance: user.balance,
      achievements: userAchievements
    },
    transactions,
    buyablesMap: buyablesMap,
    currentTransaction: transaction
  });

  if (newAchievements.length > 0) {
    const updatedAchievements = [...userAchievements, ...newAchievements];
    await storage.updateUserAchievements(userId, updatedAchievements);
  }
  return {transaction, user};
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/purchase", async (req, res) => {
    try {
      requireAuth(req);
      const userId = req.user!.id;
      const { buyableId } = req.body;
      const {transaction, user} = await purchase(userId, buyableId, 1);
      res.json({ transaction, user });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post("/api/jackpot", async (req, res) => {
    try{
      requireAuth(req);
      const userId = req.user!.id;
      if (!req.user!.allowedJackpot) {
        throw new Error("Jackpot is not allowed for this user");
      }
      const {buyableId} = req.body
      const rand = Math.floor(Math.random() * 20); // 0-19 (20 possible values, excluding 1.0)
      const multiplier = rand >= 10 ? (rand + 1) / 10 : rand / 10; // If >= 10, add 1 to skip 1.0
      const {transaction, user} = await purchase(userId, buyableId, multiplier, null, true);
      res.json({ transaction, user , multiplier});
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

  app.get("/api/admin/log", async (req, res) => {
    try {
      requireAdmin(req);
      const transactions = await storage.getAllTransactions();
      const usersMap = await storage.getUserMap();

      // Add user info to transactions
      const logInfo: LogInfo = transactions.map(t => {
        const user = usersMap[t.userId];
        return {transaction: t, user};
      });


      res.json(logInfo);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

    app.get("/api/transactions/:id", async (req, res) => {
    try {
      requireAuth(req);
      if (parseInt(req.params.id) !== req.user!.id && !req.user!.isAdmin) {
        throw new Error("Forbidden");
      }
      const transactions = await storage.getTransactions(parseInt(req.params.id));
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
        type: "DEPOSIT",
        item: null,
        groupId: null,
        isJackpot: false
      });

      // Update user balance
      const user = await storage.updateUserBalance(userId, amount);

      // Check for new achievements
      const transactions = await storage.getTransactions(userId);
      const userAchievements = JSON.parse(user.achievements);

      const buyables = await storage.getAllBuyables();
      const buyablesMap = buyables.reduce<Record<number, Buyable>>((acc, buyable) => {
        acc[buyable.id] = buyable;
        return acc;
      }, {});

      const newAchievements = checkForNewAchievements({
        user: {
          balance: user.balance,
          achievements: userAchievements
        },
        transactions,
        buyablesMap: buyablesMap,
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

  app.post("/api/admin/users", async (req, res) => {
    try {
      requireAdmin(req);
      const { username, password, isAdmin } = req.body;
      if(!username || !password) throw new Error(
        "Nutzername und Passwort erforderlich"
      )

      // Check if the username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        throw new Error(`Benutzername ${username} bereits vergeben`);
      }
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        isAdmin
      });
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
      const { isAdmin, allowedJackpot } = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), { isAdmin, allowedJackpot });
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

  app.post("/api/change-username", async (req, res) => {
    try {
      requireAuth(req);
      const { newUsername } = req.body;
      const user = req.user!;
            // Update username
      const updatedUser = await storage.updateUser(user.id, { username: newUsername });
      res.json(updatedUser);
    } catch (err: any) {
      if (err.message.includes("duplicate key")) {
        return res.status(400).json({ error: "Username already taken" });
      }
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/stats/:userId", async (req, res) => {
    try {
      requireAuth(req);
      // Users can only access their own statistics
      if (parseInt(req.params.userId) !== req.user!.id && !req.user!.isAdmin) {
        throw new Error("Forbidden");
      }

      const {from, to} = req.query;

      const start = from ? new Date(from as string) : undefined;
      const end = to ? new Date(to as string) : new Date();
      end.setHours(23, 59, 59, 999);

      const stats = await calculateStatistics({
          userId: parseInt(req.params.userId),
          timeRange: {start, end}
      });

      res.json(stats);
    } catch (err) {
      res.status(400).json({error: (err as Error).message});
    }
  });

  // Öffentliche Routen für Buyables
  app.get("/api/buyables", async (req, res) => {
    try {
      const buyables = await storage.getAllBuyables();
      res.json(buyables);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/buyables/map", async (req, res) => {
    try {
      const buyablesMap = await storage.getBuyablesMap();
      res.json(buyablesMap);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/buyables/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Ungültige ID");
      }
      const buyable = await storage.getBuyable(id);
      if (!buyable) {
        return res.status(404).json({ error: "Buyable nicht gefunden" });
      }
      res.json(buyable);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Admin-Routen für Buyables (Create, Update, Delete)
  app.post("/api/admin/buyables", async (req, res) => {
    try {
      requireAdmin(req);
      const { name, price, stock, category } = req.body;
      if (!name || price == null || !category) {
        throw new Error("Erforderliche Felder fehlen: name, price, category");
      }
      const buyable = await storage.createBuyable({ name, price, stock, category });
      res.json(buyable);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/admin/buyables/:id", async (req, res) => {
    try {
      requireAdmin(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Ungültige ID");
      }
      const updates = req.body;
      const buyable = await storage.updateBuyable(id, updates);
      res.json(buyable);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/admin/buyables/:id/restock", async (req, res) => {
    try {
      requireAdmin(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Ungültige ID");
      }
      const {amount} = req.body;
      const buyable = await storage.updateBuyableStock(id, amount);
      res.json(buyable);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/admin/buyables/:id", async (req, res) => {
    try {
      requireAdmin(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Ungültige ID");
      }
      await storage.deleteBuyable(id);
      res.sendStatus(200);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/admin/buyables/:id/restore", async (req, res) => {
    try {
      requireAdmin(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Ungültige ID");
      }
      await storage.deleteBuyable(id, true);
      res.sendStatus(200);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  })
  
  app.get("/api/admin/achievements/unlock", async (req, res) => {
    try {
      requireAdmin(req);
      requireAuth(req);
      const user = req.user!;
      const now = new Date().toISOString();

      const allAchievements = achievements.map(a => ({
        name: a.name,
        id: a.id,
        description: a.description,
        unlockedAt: now
      } as Achievement));

      await storage.updateUserAchievements(user.id, allAchievements);

      res.sendStatus(200);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  })


  // ---------------------- Gruppenverwaltung ----------------------

// Gruppe erstellen
  app.post("/api/groups", async (req, res) => {
    try {
      requireAuth(req);
      const { name } = req.body;
      if (!name) throw new Error("Gruppenname erforderlich");
      const group = await storage.createGroup(name, req.user!.id);
      res.json(group);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/groups", async (req, res) => {
    try {
      requireAuth(req);
      const groups = await storage.getGroups(req.user!.id);
      const groupsWithUsers: GroupWithUsers[] = [];
      for (let group of groups) {
        const users = await storage.getGroupMembers(group.id);
        groupsWithUsers.push({
          id: group.id,
          name: group.name,
          members: users
        })
      }
      res.json(groupsWithUsers);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  })

  app.post("/api/groups/:groupId/purchase", async (req, res) => {
    try{
      requireAuth(req);
      const groupId = parseInt(req.params.groupId);
      await requireGroupmember(req, groupId);

      const members: User[] = await storage.getGroupMembers(groupId);
      const {buyableId} = req.body;
      const multiplier = 1./members.length;
      const result: { transaction: Transaction, user: User }[] = [];
      for (const member of members) {
        const {transaction, user} = await purchase(member.id, buyableId, multiplier, groupId, false);
        result.push({transaction, user});
      }
      await storage.updateBuyableStock(buyableId, -1);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Mitglieder einer Gruppe abrufen
  app.get("/api/groups/:groupId/members", async (req, res) => {
    try {
      requireAuth(req);
      const groupId = parseInt(req.params.groupId);
      await requireGroupmember(req, groupId);
      const members = await storage.getGroupMembersAndInvitations(groupId);
      res.json(members);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Benutzer zu einer Gruppe einladen
  app.post("/api/groups/:groupId/invite", async (req, res) => {
    try {
      requireAuth(req);
      const groupId = parseInt(req.params.groupId);
      await requireGroupmember(req, groupId);
      const { username } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user) {throw new Error("Nutzer nicht gefunden");}
      const invitation = await storage.inviteUserToGroup(groupId, user.id);
      res.json(invitation);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Gruppen-Einladungen des eingeloggten Nutzers abrufen
  app.get("/api/groups/invitations", async (req, res) => {
    try {
      requireAuth(req);
      const userId = req.user!.id;
      const invitations = await storage.getInvitations(userId);
      res.json(invitations);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Einladung beantworten (annehmen oder ablehnen)
  app.post("/api/groups/:groupId/respond", async (req, res) => {
    try {
      requireAuth(req);
      const groupId = parseInt(req.params.groupId);
      const { response } = req.body; // Erwartet "accepted" oder "rejected"
      if (isNaN(groupId) || (response !== "accepted" && response !== "rejected"))
        throw new Error("Ungültige Eingabe");
      const updatedInvitation = await storage.respondToInvitation(groupId, req.user!.id, response);
      res.json(updatedInvitation);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Gruppe verlassen
  app.delete("/api/groups/:groupId/leave", async (req, res) => {
    try {
      requireAuth(req);
      const groupId = parseInt(req.params.groupId);
      await requireGroupmember(req, groupId);
      await storage.leaveGroup(groupId, req.user!.id);
      res.sendStatus(200);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });


  return createServer(app);
}
