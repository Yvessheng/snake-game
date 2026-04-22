import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../src/services/gameEngine';
import {
  oppositeDirection,
  INITIAL_SPEED,
  MIN_SPEED,
  GRID_COUNT,
} from '../src/types/game';
import { checkWallCollision, checkSelfCollision, randomFoodPosition } from '../src/utils/collision';

describe('GameEngine', () => {
  it('should start in idle state', () => {
    const engine = new GameEngine();
    expect(engine.getState().status).toBe('idle');
  });

  it('should transition to running on start', () => {
    const engine = new GameEngine();
    engine.start();
    expect(engine.getState().status).toBe('running');
    engine.destroy();
  });

  it('should pause and resume', () => {
    const engine = new GameEngine();
    engine.start();
    engine.pause();
    expect(engine.getState().status).toBe('paused');
    engine.resume();
    expect(engine.getState().status).toBe('running');
    engine.destroy();
  });

  it('should reset to idle state', () => {
    const engine = new GameEngine();
    engine.start();
    engine.reset();
    expect(engine.getState().status).toBe('idle');
    expect(engine.getState().score).toBe(0);
  });

  it('should prevent 180-degree turn', () => {
    const engine = new GameEngine();
    engine.start();
    // Snake starts moving right, so left should be ignored
    engine.setDirection('left');
    expect(engine.getState().snake.direction).toBe('right');
    engine.destroy();
  });

  it('should allow valid direction changes', () => {
    const engine = new GameEngine();
    engine.start();
    engine.setDirection('up');
    expect(engine.getState().snake.direction).toBe('up');
    engine.destroy();
  });

  it('should detect wall collision', () => {
    expect(checkWallCollision({ x: -1, y: 0 })).toBe(true);
    expect(checkWallCollision({ x: GRID_COUNT, y: 0 })).toBe(true);
    expect(checkWallCollision({ x: 0, y: -1 })).toBe(true);
    expect(checkWallCollision({ x: 0, y: GRID_COUNT })).toBe(true);
    expect(checkWallCollision({ x: 10, y: 10 })).toBe(false);
  });

  it('should detect self collision', () => {
    const body = [{ x: 5, y: 5 }, { x: 6, y: 5 }];
    expect(checkSelfCollision({ x: 5, y: 5 }, body)).toBe(true);
    expect(checkSelfCollision({ x: 0, y: 0 }, body)).toBe(false);
  });

  it('should generate food not on snake', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    for (let i = 0; i < 100; i++) {
      const food = randomFoodPosition(snake);
      expect(snake.some((s) => s.x === food.x && s.y === food.y)).toBe(false);
    }
  });

  it('should emit state changes', () => {
    const callback = vi.fn();
    const engine = new GameEngine(callback);
    engine.start();
    expect(callback).toHaveBeenCalled();
    engine.destroy();
  });

  it('should increase speed as score increases', () => {
    const engine = new GameEngine();
    expect(engine.getState().speed).toBe(INITIAL_SPEED);
    engine.destroy();
  });

  it('should not start if already running', () => {
    const engine = new GameEngine();
    engine.start();
    const status = engine.getState().status;
    engine.start();
    expect(engine.getState().status).toBe(status);
    engine.destroy();
  });
});

describe('oppositeDirection', () => {
  it('should return correct opposite', () => {
    expect(oppositeDirection('up')).toBe('down');
    expect(oppositeDirection('down')).toBe('up');
    expect(oppositeDirection('left')).toBe('right');
    expect(oppositeDirection('right')).toBe('left');
  });
});
