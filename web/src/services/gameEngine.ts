import {
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_DECREASE,
  SCORE_PER_FOOD,
  POINTS_PER_SPEED_UP,
  oppositeDirection,
} from '../types/game';
import type {
  Direction,
  GameStatus,
  Position,
  SnakeState,
  FoodState,
} from '../types/game';
import { checkWallCollision, checkSelfCollision, randomFoodPosition } from '../utils/collision';

export type GameEventType = 'eat' | 'die' | 'start';
export type GameEventCallback = (type: GameEventType) => void;

export interface GameState {
  snake: SnakeState;
  foods: FoodState[];
  score: number;
  status: GameStatus;
  speed: number;
  duration: number; // ms elapsed
}

const INITIAL_SNAKE: Position[] = [
  { x: 20, y: 20 },
  { x: 19, y: 20 },
  { x: 18, y: 20 },
];

export class GameEngine {
  private state: GameState;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (state: GameState) => void;
  private onEvent?: GameEventCallback;

  constructor(onStateChange?: (state: GameState) => void, onEvent?: GameEventCallback) {
    this.onStateChange = onStateChange;
    this.state = this.createInitialState();
  }

  getState(): GameState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.status === 'running') return;
    this.state.status = 'running';
    this.onEvent?.('start');
    this.runTick();
    this.startDurationTimer();
    this.emit();
  }

  pause(): void {
    if (this.state.status !== 'running') return;
    this.state.status = 'paused';
    this.stopTickTimer();
    this.stopDurationTimer();
    this.emit();
  }

  resume(): void {
    if (this.state.status !== 'paused') return;
    this.state.status = 'running';
    this.runTick();
    this.startDurationTimer();
    this.emit();
  }

  reset(): void {
    this.stopTickTimer();
    this.stopDurationTimer();
    this.state = this.createInitialState();
    this.emit();
  }

  setDirection(dir: Direction): void {
    if (this.state.status !== 'running') return;
    if (dir === this.state.snake.direction) return;
    if (dir === oppositeDirection(this.state.snake.direction)) return;
    this.state.snake.direction = dir;
  }

  // Execute one game tick
  private tick(): void {
    const { snake } = this.state;
    const head = { ...snake.segments[0] };

    // Move head
    switch (snake.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }

    // Wall collision
    if (checkWallCollision(head)) {
      this.state.status = 'gameover';
      this.stopTickTimer();
      this.stopDurationTimer();
      this.onEvent?.('die');
      this.emit();
      return;
    }

    // Self collision
    if (checkSelfCollision(head, snake.segments)) {
      this.state.status = 'gameover';
      this.stopTickTimer();
      this.stopDurationTimer();
      this.onEvent?.('die');
      this.emit();
      return;
    }

    // Add new head
    snake.segments.unshift(head);

    // Check food collision
    let ate = false;
    this.state.foods = this.state.foods.filter((food) => {
      if (food.position.x === head.x && food.position.y === head.y) {
        ate = true;
        this.state.score += SCORE_PER_FOOD;
        this.onEvent?.('eat');
        this.updateSpeed();
        return false;
      }
      return true;
    });

    // Remove tail if no food eaten
    if (!ate) {
      snake.segments.pop();
    } else {
      // Spawn new food
      this.state.foods.push({
        position: randomFoodPosition(snake.segments),
        type: 'normal',
      });
    }

    this.emit();
  }

  private updateSpeed(): void {
    const speedUps = Math.floor(this.state.score / POINTS_PER_SPEED_UP);
    this.state.speed = Math.max(MIN_SPEED, INITIAL_SPEED - speedUps * SPEED_DECREASE);
    // Restart tick timer with new speed
    if (this.tickTimer) {
      this.stopTickTimer();
      this.runTick();
    }
  }

  private runTick(): void {
    this.tickTimer = setInterval(() => this.tick(), this.state.speed);
  }

  private stopTickTimer(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private startDurationTimer(): void {
    this.durationTimer = setInterval(() => {
      this.state.duration += 100;
    }, 100);
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  private createInitialState(): GameState {
    const snake: SnakeState = {
      segments: [...INITIAL_SNAKE],
      direction: 'right',
    };
    const foods: FoodState[] = [
      { position: randomFoodPosition(snake.segments), type: 'normal' },
    ];
    return {
      snake,
      foods,
      score: 0,
      status: 'idle',
      speed: INITIAL_SPEED,
      duration: 0,
    };
  }

  private emit(): void {
    this.onStateChange?.(this.getState());
  }

  destroy(): void {
    this.stopTickTimer();
    this.stopDurationTimer();
  }
}
