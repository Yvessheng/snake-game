import { prisma } from '../db';
import { ACHIEVEMENTS, type AchievementStats } from '../types/achievements';

export async function checkAndUnlockAchievements(userId: string, stats: AchievementStats): Promise<string[]> {
  const unlocked = await prisma.achievement.findMany({
    where: { userId },
    select: { achievementKey: true },
  });
  const unlockedKeys = new Set(unlocked.map((a) => a.achievementKey));
  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENTS) {
    if (!unlockedKeys.has(def.key) && def.check(stats)) {
      await prisma.achievement.create({
        data: {
          userId,
          achievementKey: def.key,
          achievementName: def.name,
        },
      });
      newlyUnlocked.push(def.key);
    }
  }

  return newlyUnlocked;
}

export interface UserAchievement {
  key: string;
  name: string;
  description: string;
  unlockedAt: Date | null;
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const unlocked = await prisma.achievement.findMany({
    where: { userId },
    select: { achievementKey: true, unlockedAt: true },
  });
  const unlockedMap = new Map(unlocked.map((a) => [a.achievementKey, a.unlockedAt]));

  return ACHIEVEMENTS.map((def) => ({
    key: def.key,
    name: def.name,
    description: def.description,
    unlockedAt: unlockedMap.get(def.key) ?? null,
  }));
}
