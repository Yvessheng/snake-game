import { prisma } from '../db';

export async function getLeaderboard(limit: number, offset: number) {
  const users = await prisma.user.findMany({
    orderBy: { highestScore: 'desc' },
    skip: offset,
    take: limit,
    select: {
      id: true,
      username: true,
      highestScore: true,
      totalGames: true,
      createdAt: true,
    },
  });

  const total = await prisma.user.count();

  return {
    entries: users.map((u, i) => ({ ...u, rank: offset + i + 1 })),
    total,
    page: Math.floor(offset / limit) + 1,
  };
}

export async function getMyRank(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, highestScore: true, totalGames: true, totalScore: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const rank = await prisma.user.count({
    where: { highestScore: { gt: user.highestScore } },
  });

  return {
    ...user,
    rank: rank + 1,
  };
}
