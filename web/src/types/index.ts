export type { Direction, GameStatus, Position, SnakeState, FoodState } from '../types/game';
export {
  GRID_SIZE,
  GRID_COUNT,
  CANVAS_SIZE,
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_DECREASE,
  SCORE_PER_FOOD,
  POINTS_PER_SPEED_UP,
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
  id: string;
  username: string;
  highestScore: number;
  totalGames: number;
  createdAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
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
