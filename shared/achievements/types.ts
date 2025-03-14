import {Buyable, Transaction} from "../schema";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string | null;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  check: (params: AchievementCheckParams) => boolean;
}

export interface AchievementCheckParams {
  user: {
    balance: number;
    achievements: Achievement[];
  };
  transactions: Transaction[];
  buyablesMap: Record<number, Buyable>
  currentTransaction?: Transaction;
}

// Helper to create achievement definitions with proper typing
export function defineAchievement(achievement: AchievementDefinition): AchievementDefinition {
  return achievement;
}
