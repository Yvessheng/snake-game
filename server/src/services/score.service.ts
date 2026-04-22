import { prisma } from '../db';
import { BadRequestError, RateLimitError } from './errors';
import { checkAndUnlockAchievements } from './achievement.service';
import type { AchievementStats } from '../types/achievements';

const MAX_DAILY_SUBMISSIONS = 50;
const MIN_GAME_DURATION_MS = 10_000; // 10 seconds minimum

interface ScoreInput {
  score: number;
  snakeLength: number;
  gameDuration: number;
  gameMode?: string;
}

interface ScoreResponse {
  id: string;
  rank: number;
  newHighestScore: boolean;
  newlyUnlockedAchievements: string[];
}

export async function submitScore(userId: string, input: ScoreInput): Promise<ScoreResponse> {
  // Validate score
  if (input.score <= 0) {
    throw new BadRequestError('Score must be greater than 0');
  }

  // Anti-cheat: minimum game duration
  if (input.gameDuration < MIN_GAME_DURATION_MS) {
    throw new BadRequestError('Game duration too short');
  }

  // Daily submission limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await prisma.score.count({
    where: {
      userId,
      playedAt: { gte: startOfDay },
    },
  });

  if (todayCount >= MAX_DAILY_SUBMISSIONS) {
    throw new RateLimitError('Daily submission limit reached');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Create score record
  const score = await prisma.score.create({
    data: {
      userId,
      score: input.score,
      snakeLength: input.snakeLength,
      gameDuration: input.gameDuration,
      gameMode: input.gameMode ?? 'classic',
    },
  });

  // Update user stats
  const updateData: { highestScore?: number; totalGames: { increment: number }; totalScore: { increment: number } } = {
    totalGames: { increment: 1 },
    totalScore: { increment: input.score },
  };

  const newHighestScore = input.score > user.highestScore;
  if (newHighestScore) {
    updateData.highestScore = input.score;
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Calculate rank
  const rank = await prisma.user.count({
    where: { highestScore: { gt: newHighestScore ? input.score : user.highestScore } },
  });

  // Check and unlock achievements
  const achievementStats: AchievementStats = {
    score: input.score,
    snakeLength: input.snakeLength,
    gameDuration: input.gameDuration,
    totalGames: user.totalGames + 1,
    rank: rank + 1,
  };
  const newlyUnlocked = await checkAndUnlockAchievements(userId, achievementStats);

  return {
    id: score.id,
    rank: rank + 1,
    newHighestScore,
    newlyUnlockedAchievements: newlyUnlocked,
  };
}
