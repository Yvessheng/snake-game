import { useEffect, useRef } from 'react';
import { GRID_SIZE, CANVAS_SIZE, getFoodConfig, isPunishmentFood, ZONES } from '../../types/game';
import type { Position, FoodState, ZoneId, PendingEffect } from '../../types/game';
import type { GameState } from '../../services/gameEngine';
import type { SkinId } from '../../types/skins';
import { getSkin } from '../../types/skins';

interface GameCanvasProps {
  state: GameState;
  skinId?: SkinId;
}

// Particle system
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; life: number;
}

const particles: Particle[] = [];
const MAX_PARTICLES = 60;

function addParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    particles.push({
      x: x * GRID_SIZE + GRID_SIZE / 2,
      y: y * GRID_SIZE + GRID_SIZE / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color,
      life: 8 + Math.floor(Math.random() * 4),
    });
  }
}

function updateParticles(ctx: CanvasRenderingContext2D) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    const alpha = p.life / 12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
    if (p.life <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
}

export function GameCanvas({ state, skinId = 'classic' }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeRef = useRef(0);
  const animFrameRef = useRef(0);
  const pulseRef = useRef(0);
  const prevFoodsRef = useRef<FoodState[]>([]);

  // Detect food eaten and spawn particles
  useEffect(() => {
    const prev = prevFoodsRef.current;
    const curr = state.foods;
    for (const pf of prev) {
      if (!curr.some((f: FoodState) => f.position.x === pf.position.x && f.position.y === pf.position.y)) {
        // This food was eaten
        const config = getFoodConfig(pf.type);
        addParticles(pf.position.x, pf.position.y, config.color, 6);
      }
    }
    prevFoodsRef.current = curr;
  }, [state.foods]);

  // Game over fade animation
  useEffect(() => {
    if (state.status === 'gameover') {
      let running = true;
      const animate = () => {
        if (!running) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const skin = getSkin(skinId);
        fadeRef.current = Math.min(1, fadeRef.current + 0.03);
        renderGame(ctx, state, skin, 1, true);
        // Dark overlay
        ctx.fillStyle = `rgba(128, 0, 0, ${fadeRef.current * 0.3})`;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        drawOverlay(ctx, '游戏结束', '#FFFFFF');
        if (fadeRef.current < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
      return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
    }

    // Normal render - use rAF for smooth animations
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(animFrameRef.current);
    fadeRef.current = 0;
    const skin = getSkin(skinId);

    const render = () => {
      pulseRef.current += 0.03;
      renderGame(ctx, state, skin, pulseRef.current, false);
      if (state.status === 'running' || state.status === 'paused' || state.status === 'idle') {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state, skinId]);

  return (
    <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ display: 'block' }} />
  );
}

function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  skin: ReturnType<typeof getSkin>,
  pulse: number,
  isGameOver: boolean
) {
  // Draw zone backgrounds
  drawZones(ctx, state.unlockedZones, state.currentZone, pulse);

  // Draw brick wall at boundary
  drawBrickWall(ctx, state.unlockedZones, pulse);

  // Draw grid
  drawGrid(ctx);

  // Draw food
  state.foods.forEach((food: FoodState) => drawFood(ctx, food, pulse, Date.now()));

  // Draw snake (handle temporary segments)
  const tempCount = state.temporarySegments.reduce((sum, b) => sum + b.count, 0);
  const totalSegs = state.snake.segments.length;
  state.snake.segments.forEach((seg: Position, i: number) => {
    const isTemp = i >= totalSegs - tempCount;
    drawSnakeSegment(ctx, seg, i === 0, skin, state.shieldActive, isTemp);
  });

  // Draw pending effect warning above head
  const head = state.snake.segments[0];
  drawPendingEffectWarning(ctx, head, state.pendingEffects, pulse);

  // Draw particles
  updateParticles(ctx);

  // Draw overlay for idle/paused
  if (!isGameOver) {
    if (state.status === 'paused') {
      drawOverlay(ctx, '已暂停', '#000000');
    } else if (state.status === 'idle') {
      drawOverlay(ctx, '按任意键开始', '#000000');
    }
  }
}

function drawZones(
  ctx: CanvasRenderingContext2D,
  unlockedZones: ZoneId[],
  _currentZone: ZoneId,
  _pulse: number
) {
  // Draw unlocked zones (outermost first)
  const sorted = [...ZONES].filter((z) => unlockedZones.includes(z.id)).reverse();
  for (const zone of sorted) {
    const { bounds, bgColor } = zone;
    ctx.fillStyle = bgColor;
    ctx.fillRect(
      bounds.minX * GRID_SIZE,
      bounds.minY * GRID_SIZE,
      (bounds.maxX - bounds.minX + 1) * GRID_SIZE,
      (bounds.maxY - bounds.minY + 1) * GRID_SIZE,
    );
  }
}

function drawBrickWall(
  ctx: CanvasRenderingContext2D,
  unlockedZones: ZoneId[],
  pulse: number
) {
  // Get the largest unlocked zone boundary
  let bounds = ZONES[0].bounds;
  for (const zone of ZONES) {
    if (unlockedZones.includes(zone.id)) {
      bounds = zone.bounds;
    }
  }

  const BRICK_W = GRID_SIZE * 2;
  const BRICK_H = GRID_SIZE;
  const MORTAR = 2;
  const pulseAlpha = 0.85 + 0.15 * Math.sin(pulse * 2);

  ctx.globalAlpha = pulseAlpha;

  const topY = Math.max(0, (bounds.minY - 1) * GRID_SIZE);
  drawBrickRow(ctx, bounds.minX * GRID_SIZE, topY,
    (bounds.maxX - bounds.minX + 1) * GRID_SIZE, BRICK_H, BRICK_W, MORTAR, true);

  const bottomY = Math.min(CANVAS_SIZE - BRICK_H, (bounds.maxY + 1) * GRID_SIZE);
  drawBrickRow(ctx, bounds.minX * GRID_SIZE, bottomY,
    (bounds.maxX - bounds.minX + 1) * GRID_SIZE, BRICK_H, BRICK_W, MORTAR, true);

  const leftX = Math.max(0, (bounds.minX - 1) * GRID_SIZE);
  drawBrickColumn(ctx, leftX, bounds.minY * GRID_SIZE,
    (bounds.maxY - bounds.minY + 1) * GRID_SIZE, GRID_SIZE, MORTAR);

  const rightX = Math.min(CANVAS_SIZE - GRID_SIZE, (bounds.maxX + 1) * GRID_SIZE);
  drawBrickColumn(ctx, rightX, bounds.minY * GRID_SIZE,
    (bounds.maxY - bounds.minY + 1) * GRID_SIZE, GRID_SIZE, MORTAR);

  ctx.globalAlpha = 1;
}

function drawBrickRow(
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  totalWidth: number, brickH: number,
  brickW: number, mortar: number,
  offsetRow: boolean
) {
  const brickColor = '#CC6633';
  const mortarColor = '#996633';
  const offset = offsetRow ? Math.floor(brickW / 2) : 0;

  ctx.fillStyle = mortarColor;
  ctx.fillRect(startX, startY, totalWidth, brickH);

  ctx.fillStyle = brickColor;
  let x = startX + offset;
  while (x < startX + totalWidth) {
    const w = Math.min(brickW, startX + totalWidth - x);
    if (w > mortar) {
      ctx.fillRect(x + Math.floor(mortar / 2), startY + Math.floor(mortar / 2),
        w - mortar, brickH - mortar);
    }
    x += brickW;
  }
}

function drawBrickColumn(
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  totalHeight: number,
  brickW: number, mortar: number
) {
  const brickColor = '#CC6633';
  const mortarColor = '#996633';
  const brickH = GRID_SIZE;

  ctx.fillStyle = mortarColor;
  ctx.fillRect(startX, startY, brickW, totalHeight);

  ctx.fillStyle = brickColor;
  let y = startY;
  while (y < startY + totalHeight) {
    const h = Math.min(brickH, startY + totalHeight - y);
    if (h > mortar) {
      ctx.fillRect(startX + Math.floor(mortar / 2), y + Math.floor(mortar / 2),
        brickW - mortar, h - mortar);
    }
    y += brickH;
  }
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([1, 3]);
  for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_SIZE, i);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawSnakeSegment(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  isHead: boolean,
  skin: ReturnType<typeof getSkin>,
  shieldActive: boolean,
  isTemp: boolean = false
) {
  if (isTemp) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#888888';
  } else {
    ctx.fillStyle = isHead ? skin.head : skin.body;
  }
  ctx.fillRect(pos.x * GRID_SIZE, pos.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  ctx.globalAlpha = 1;

  // Shield glow
  if (shieldActive && isHead) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      pos.x * GRID_SIZE - 1,
      pos.y * GRID_SIZE - 1,
      GRID_SIZE + 2,
      GRID_SIZE + 2,
    );
  }

  // Body border
  ctx.strokeStyle = isHead ? '#FFFFFF' : shadeColor(skin.body, -20);
  ctx.lineWidth = 1;
  ctx.strokeRect(
    pos.x * GRID_SIZE + 0.5,
    pos.y * GRID_SIZE + 0.5,
    GRID_SIZE - 1,
    GRID_SIZE - 1,
  );

  // Eyes on head
  if (isHead) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(pos.x * GRID_SIZE + 4, pos.y * GRID_SIZE + 4, 3, 3);
    ctx.fillRect(pos.x * GRID_SIZE + 9, pos.y * GRID_SIZE + 4, 3, 3);
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: FoodState, _pulse: number, now?: number) {
  const config = getFoodConfig(food.type);
  const { x, y } = food.position;
  const px = x * GRID_SIZE;
  const py = y * GRID_SIZE;

  // White background square for visibility
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);

  // Border
  if (isPunishmentFood(food.type)) {
    const pulseBorder = 0.6 + 0.4 * Math.sin(_pulse * 1.5);
    ctx.globalAlpha = pulseBorder;
    ctx.strokeStyle = food.type === 'rottenTomato' ? '#CC3333' : '#663366';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, GRID_SIZE, GRID_SIZE);
    ctx.globalAlpha = 1;

    // Warning indicator
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#FF0000';
    ctx.fillText('⚠', px + GRID_SIZE - 8, py + 9);
  } else {
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);
  }

  // Emoji icon centered
  const timeLeft = food.expireTime - (now ?? 0);
  const isExpiringSoon = timeLeft < 2000 && timeLeft > 0;
  if (isExpiringSoon) {
    ctx.globalAlpha = Math.sin(Date.now() * 0.01) * 0.4 + 0.6;
  } else {
    ctx.globalAlpha = 1;
  }
  ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.icon, px + GRID_SIZE / 2, py + GRID_SIZE / 2 + 1);
  ctx.globalAlpha = 1;
}

function drawPendingEffectWarning(
  ctx: CanvasRenderingContext2D,
  head: Position,
  pendingEffects: PendingEffect[],
  pulse: number
) {
  const now = Date.now();
  const warning = pendingEffects.find(
    (p) => !p.triggered && now >= p.warningAt && now < p.triggerAt
  );

  if (warning && warning.sourceFood) {
    const config = getFoodConfig(warning.sourceFood);
    const px = head.x * GRID_SIZE;
    const py = head.y * GRID_SIZE;

    const blinkAlpha = Math.sin(pulse * 4) * 0.4 + 0.6;
    ctx.globalAlpha = blinkAlpha;
    ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.icon, px + GRID_SIZE / 2, py - 4);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, text: string, color: string) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = color;
  ctx.font = 'bold 18px "MS Sans Serif", "Tahoma", "SimSun", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) * (100 + percent)) / 100));
  const g = Math.min(255, Math.max(0, (((num >> 8) & 0x00FF) * (100 + percent)) / 100));
  const b = Math.min(255, Math.max(0, ((num & 0x0000FF) * (100 + percent)) / 100));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
