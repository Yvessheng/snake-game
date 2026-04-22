export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'idle' | 'running' | 'paused' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeState {
  segments: Position[];
  direction: Direction;
}

export interface FoodState {
  position: Position;
  type: 'normal';
}

export const GRID_SIZE = 15;
export const GRID_COUNT = 40;
export const CANVAS_SIZE = GRID_COUNT * GRID_SIZE; // 600

export const INITIAL_SPEED = 120;
export const MIN_SPEED = 50;
export const SPEED_DECREASE = 10;
export const SCORE_PER_FOOD = 10;
export const POINTS_PER_SPEED_UP = 50;

export function oppositeDirection(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  return map[dir];
}
