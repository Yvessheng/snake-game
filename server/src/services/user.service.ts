import { prisma } from '../db';
import { hashPassword, generateToken, comparePassword } from '../services/auth.service';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../types/auth.schema';
import { ConflictError, UnauthorizedError, NotFoundError } from './errors';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    highestScore: number;
    totalGames: number;
    totalScore: number;
  };
}

function formatUser(user: {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  highestScore: number;
  totalGames: number;
  totalScore: number;
}): AuthResponse['user'] {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    highestScore: user.highestScore,
    totalGames: user.totalGames,
    totalScore: user.totalScore,
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const validated = registerSchema.parse(input);

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: validated.username }, { email: validated.email }] },
  });

  if (existingUser) {
    if (existingUser.username === validated.username) {
      throw new ConflictError('Username already exists');
    }
    throw new ConflictError('Email already exists');
  }

  const passwordHash = await hashPassword(validated.password);

  const user = await prisma.user.create({
    data: {
      username: validated.username,
      email: validated.email,
      passwordHash,
    },
  });

  const token = generateToken(user.id);

  return { token, user: formatUser(user) };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const validated = loginSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email: validated.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await comparePassword(validated.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { passwordHash, ...userWithoutHash } = user;
  const token = generateToken(user.id);

  return { token, user: formatUser(userWithoutHash) };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      highestScore: true,
      totalGames: true,
      totalScore: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUser(userId: string, input: { username?: string; avatarUrl?: string }) {
  if (input.username !== undefined) {
    const existing = await prisma.user.findFirst({
      where: { username: input.username, NOT: { id: userId } },
    });
    if (existing) {
      throw new ConflictError('Username already exists');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.username !== undefined && { username: input.username }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      highestScore: true,
      totalGames: true,
      totalScore: true,
      createdAt: true,
    },
  });

  return user;
}

export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const [totalGames, avgScore, rank] = await Promise.all([
    prisma.score.count({ where: { userId } }),
    prisma.score.aggregate({
      where: { userId },
      _avg: { score: true },
    }),
    prisma.user.count({
      where: { highestScore: { gt: user.highestScore } },
    }),
  ]);

  return {
    userId: user.id,
    username: user.username,
    highestScore: user.highestScore,
    totalGames,
    totalScore: user.totalScore,
    averageScore: Math.round(avgScore._avg.score ?? 0),
    rank: rank + 1,
    createdAt: user.createdAt,
  };
}
