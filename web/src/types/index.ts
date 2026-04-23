export type { Direction, GameStatus, Position, SnakeState, FoodState } from '../types/game';
export {
  GRID_SIZE,
  GRID_COUNT,
  CANVAS_SIZE,
  BASE_TICK_MS,
  MIN_TICK_MS,
  oppositeDirection,
} from '../types/game';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  highestScore: number;
  totalGames: number;
  totalScore: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  snakeLength: number;
  gameDuration: number;
  gameMode: string;
  playedAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
}

export interface MyRankResponse {
  userId: string;
  username: string;
  highestScore: number;
  totalGames: number;
  totalScore: number;
  rank: number;
}

export interface ScoreSubmission {
  score: number;
  snakeLength: number;
  gameDuration: number;
  gameMode?: string;
}

export interface ScoreResult {
  id: string;
  rank: number;
  newHighestScore: boolean;
  newlyUnlockedAchievements: string[];
}
