import { achievements } from "./definitions";
import type { Achievement, AchievementCheckParams } from "./types";

export function checkForNewAchievements(params: AchievementCheckParams): Achievement[] {
  const unlockedAchievements = params.user.achievements;
  const newAchievements: Achievement[] = [];
  const now = new Date().toISOString();

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (unlockedAchievements.find(a => a.id === achievement.id)) {
      continue;
    }

    // Check if achievement should be unlocked
    if (achievement.check(params)) {
      newAchievements.push({
        ...achievement,
        unlockedAt: now
      });
    }
  }

  return newAchievements;
}

export { type Achievement, type AchievementDefinition } from "./types";
export { achievements } from "./definitions";
