import type { Position, ZoneBounds } from '../types/game';
import { GRID_COUNT, ZONES } from '../types/game';

export function checkWallCollision(head: Position, bounds?: ZoneBounds): boolean {
  const minX = bounds?.minX ?? 0;
  const minY = bounds?.minY ?? 0;
  const maxX = bounds?.maxX ?? GRID_COUNT - 1;
  const maxY = bounds?.maxY ?? GRID_COUNT - 1;
  return head.x < minX || head.x > maxX || head.y < minY || head.y > maxY;
}

export function checkSelfCollision(head: Position, body: Position[]): boolean {
  return body.some((seg) => seg.x === head.x && seg.y === head.y);
}

export function randomFoodPosition(occupied: Position[]): Position {
  return randomFoodPositionInZone(null, occupied);
}

export function randomFoodPositionInZone(zoneId: string | null, occupied: Position[]): Position {
  const occupiedSet = new Set(occupied.map((p) => `${p.x},${p.y}`));
  let bounds = { minX: 0, minY: 0, maxX: GRID_COUNT - 1, maxY: GRID_COUNT - 1 };

  if (zoneId) {
    const zone = ZONES.find((z) => z.id === zoneId);
    if (zone) bounds = zone.bounds;
  }

  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: bounds.minX + Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1)),
      y: bounds.minY + Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1)),
    };
    attempts++;
    if (attempts > 500) break;
  } while (occupiedSet.has(`${pos.x},${pos.y}`));
  return pos;
}
