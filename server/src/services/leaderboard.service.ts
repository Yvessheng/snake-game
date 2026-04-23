import { prisma } from '../db';

export async function getLeaderboard(limit: number, offset: number) {
  const scores = await prisma.score.findMany({
    orderBy: { score: 'desc' },
    skip: offset,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  const total = await prisma.score.count();

  return {
    entries: scores.map((s, i) => ({
      rank: offset + i + 1,
      userId: s.user.id,
      username: s.user.username,
      score: s.score,
      snakeLength: s.snakeLength,
      gameDuration: s.gameDuration,
      gameMode: s.gameMode,
      playedAt: s.playedAt,
    })),
    total,
    page: Math.floor(offset / limit) + 1,
  };
}

export async function getMyRank(userId: string) {
  // Find the user's best score
  const bestScore = await prisma.score.findFirst({
    where: { userId },
    orderBy: { score: 'desc' },
  });

  if (!bestScore) {
    return {
      userId,
      username: '',
      highestScore: 0,
      totalGames: 0,
      totalScore: 0,
      rank: 0,
    };
  }

  const rank = await prisma.score.count({
    where: { score: { gt: bestScore.score } },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, totalGames: true, totalScore: true },
  });

  return {
    userId,
    username: user?.username ?? '',
    highestScore: bestScore.score,
    totalGames: user?.totalGames ?? 0,
    totalScore: user?.totalScore ?? 0,
    rank: rank + 1,
  };
}
