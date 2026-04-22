import type { Position } from '../types/game';
import { GRID_COUNT } from '../types/game';

export function checkWallCollision(head: Position): boolean {
  return head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT;
}

export function checkSelfCollision(head: Position, body: Position[]): boolean {
  return body.some((seg) => seg.x === head.x && seg.y === head.y);
}

export function randomFoodPosition(occupied: Position[]): Position {
  const occupiedSet = new Set(occupied.map((p) => `${p.x},${p.y}`));
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT),
    };
  } while (occupiedSet.has(`${pos.x},${pos.y}`));
  return pos;
}
