import { useEffect, useRef } from 'react';
import { GRID_SIZE, CANVAS_SIZE } from '../../types/game';
import type { Position, FoodState } from '../../types/game';
import type { GameState } from '../../services/gameEngine';
import type { SkinId } from '../../types/skins';
import { getSkin } from '../../types/skins';
import { theme } from '../../types/theme';

interface GameCanvasProps {
  state: GameState;
  skinId?: SkinId;
}

// Canvas-specific colors (separate from page theme for visual distinction)
const C = {
  bg: theme.canvas.bg,
  grid: theme.canvas.grid,
  food: theme.accent.yellow,
  overlay: 'rgba(10, 10, 15, 0.7)',
  textPrimary: theme.text.primary,
  textSecondary: theme.text.secondary,
  accentBlue: theme.accent.blue,
  accentPink: theme.accent.pink,
};

export function GameCanvas({ state, skinId = 'classic' }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const foodAnimRef = useRef(0);
  const fadeRef = useRef(0);
  const animFrameRef = useRef(0);

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
        foodAnimRef.current += 0.05;
        fadeRef.current = Math.min(1, fadeRef.current + 0.03);

        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        drawGrid(ctx);
        state.foods.forEach((food: FoodState) => {
          const glow = 0.6 + 0.4 * Math.sin(foodAnimRef.current);
          drawFood(ctx, food.position, glow);
        });

        ctx.globalAlpha = 1 - fadeRef.current * 0.5;
        state.snake.segments.forEach((seg: Position, i: number) => {
          drawSnakeSegment(ctx, seg, i === 0, skin);
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = `rgba(244, 63, 94, ${fadeRef.current * 0.25})`;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        drawOverlay(ctx, '游戏结束', C.accentPink);

        if (fadeRef.current < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
      return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(animFrameRef.current);
    fadeRef.current = 0;

    const skin = getSkin(skinId);
    foodAnimRef.current += 0.05;
    const foodGlow = 0.6 + 0.4 * Math.sin(foodAnimRef.current);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid(ctx);
    state.foods.forEach((food: FoodState) => drawFood(ctx, food.position, foodGlow));
    state.snake.segments.forEach((seg: Position, i: number) => {
      drawSnakeSegment(ctx, seg, i === 0, skin);
    });

    if (state.status === 'paused') {
      drawOverlay(ctx, '已暂停', C.accentBlue);
    } else if (state.status === 'idle') {
      drawOverlay(ctx, '按任意键开始', C.textSecondary);
    }
  }, [state, skinId]);

  return (
    <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ display: 'block' }} />
  );
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 0.5;
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
}

function drawSnakeSegment(ctx: CanvasRenderingContext2D, pos: Position, isHead: boolean, skin: ReturnType<typeof getSkin>) {
  ctx.fillStyle = isHead ? skin.head : skin.body;
  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = isHead ? 6 : 3;

  const padding = 1;
  ctx.fillRect(
    pos.x * GRID_SIZE + padding,
    pos.y * GRID_SIZE + padding,
    GRID_SIZE - padding * 2,
    GRID_SIZE - padding * 2,
  );
  ctx.shadowBlur = 0;
}

function drawFood(ctx: CanvasRenderingContext2D, pos: Position, glow: number) {
  const cx = pos.x * GRID_SIZE + GRID_SIZE / 2;
  const cy = pos.y * GRID_SIZE + GRID_SIZE / 2;
  const radius = GRID_SIZE / 2 - 2;

  ctx.fillStyle = C.food;
  ctx.shadowColor = C.food;
  ctx.shadowBlur = 6 + 4 * glow;
  ctx.globalAlpha = 0.7 + 0.3 * glow;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawOverlay(ctx: CanvasRenderingContext2D, text: string, color: string) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = color;
  ctx.font = 'bold 32px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  ctx.shadowBlur = 0;
}
