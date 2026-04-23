import { useEffect, useRef } from 'react';
import { GRID_SIZE, CANVAS_SIZE, getZoneConfig, getFoodConfig, ZONES } from '../../types/game';
import type { Position, FoodState, ZoneId } from '../../types/game';
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
      if (!curr.some((f) => f.position.x === pf.position.x && f.position.y === pf.position.y)) {
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

  // Draw grid
  drawGrid(ctx);

  // Draw food
  state.foods.forEach((food) => drawFood(ctx, food, pulse));

  // Draw snake
  state.snake.segments.forEach((seg, i) => {
    drawSnakeSegment(ctx, seg, i === 0, skin, state.shieldActive);
  });

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
  currentZone: ZoneId,
  pulse: number
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

  // Draw current zone highlight border with pulse
  const currentConfig = getZoneConfig(currentZone);
  const { bounds, borderColor } = currentConfig;
  const pulseAlpha = 0.3 + 0.2 * Math.sin(pulse);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = pulseAlpha;
  ctx.strokeRect(
    bounds.minX * GRID_SIZE + 1.5,
    bounds.minY * GRID_SIZE + 1.5,
    (bounds.maxX - bounds.minX + 1) * GRID_SIZE - 3,
    (bounds.maxY - bounds.minY + 1) * GRID_SIZE - 3,
  );
  ctx.globalAlpha = 1;
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
  shieldActive: boolean
) {
  ctx.fillStyle = isHead ? skin.head : skin.body;
  ctx.fillRect(pos.x * GRID_SIZE, pos.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

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

function drawFood(ctx: CanvasRenderingContext2D, food: FoodState, pulse: number) {
  const config = getFoodConfig(food.type);
  const { x, y } = food.position;
  const px = x * GRID_SIZE;
  const py = y * GRID_SIZE;

  // White background square for visibility
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);

  // Border
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);

  // Emoji icon centered
  ctx.globalAlpha = 1;
  ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.icon, px + GRID_SIZE / 2, py + GRID_SIZE / 2 + 1);
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
