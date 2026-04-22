import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../services/gameEngine';
import type { GameState } from '../services/gameEngine';
import { GameCanvas } from '../components/game/GameCanvas';
import { ScoreDisplay } from '../components/ui/ScoreDisplay';
import { useKeyboard } from '../hooks/useKeyboard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { soundManager } from '../services/soundManager';
import { CANVAS_SIZE } from '../types/game';
import type { SkinId } from '../types/skins';
import { loadSkin } from '../types/skins';

const GAME_BG = '#0D1117';
const PANEL_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_GREEN = '#00FF88';
const NEON_BLUE = '#00D4FF';
const NEON_PINK = '#FF3366';

function GameOverModal({
  score,
  snakeLength,
  duration,
  onReplay,
  onHome,
  onSubmitScore,
}: {
  score: number;
  snakeLength: number;
  duration: number;
  onReplay: () => void;
  onHome: () => void;
  onSubmitScore: () => Promise<void>;
}) {
  const { isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const totalSec = Math.floor(duration / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onSubmitScore();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,17,23,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, width: 340, textAlign: 'center' }}>
        <h2 style={{ color: NEON_PINK, marginBottom: 16, fontSize: 24 }}>游戏结束!</h2>
        <div style={{ fontSize: 48, fontWeight: 'bold', color: NEON_GREEN, marginBottom: 16 }}>{score}</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24, fontSize: 14, color: TEXT_SECONDARY }}>
          <div>蛇长度: {snakeLength}</div>
          <div>时长: {min}m {sec}s</div>
        </div>
        {error && <div style={{ color: NEON_PINK, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {submitted && <div style={{ color: NEON_GREEN, fontSize: 12, marginBottom: 12 }}>分数已提交!</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={onReplay} style={{ flex: 1, padding: '10px 0', background: NEON_BLUE, border: 'none', borderRadius: 4, color: GAME_BG, fontWeight: 'bold', cursor: 'pointer' }}>重新游戏</button>
          {isAuthenticated && !submitted && (
            <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '10px 0', background: NEON_GREEN, border: 'none', borderRadius: 4, color: GAME_BG, fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? '提交中...' : '提交分数'}</button>
          )}
        </div>
        {isAuthenticated && submitted && (
          <button onClick={onHome} style={{ width: '100%', padding: '10px 0', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT_SECONDARY, cursor: 'pointer', marginBottom: 8 }}>返回首页</button>
        )}
        {!isAuthenticated && <p style={{ fontSize: 12, color: TEXT_SECONDARY }}>登录后可以提交分数</p>}
      </div>
    </div>
  );
}

export function GamePage() {
  const { user, getToken } = useAuth();
  const [skinId] = useState<SkinId>(() => loadSkin());
  const [gameState, setGameState] = useState<GameState>(() => {
    return new GameEngine().getState();
  });
  const engineRef = useRef<GameEngine>(new GameEngine(setGameState));

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleGameEvent = useCallback((type: 'eat' | 'die' | 'start') => {
    soundManager.play(type);
  }, []);

  useEffect(() => {
    engineRef.current = new GameEngine(handleStateChange, handleGameEvent);
    return () => engineRef.current.destroy();
  }, [handleStateChange, handleGameEvent]);

  const handleDirection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const engine = engineRef.current;
      if (engine.getState().status === 'idle') {
        engine.start();
      }
      engine.setDirection(dir);
    },
    [],
  );

  const handleSpace = useCallback(() => {
    const engine = engineRef.current;
    const status = engine.getState().status;
    if (status === 'running') {
      engine.pause();
    } else if (status === 'paused') {
      engine.resume();
    } else if (status === 'idle') {
      engine.start();
    }
  }, []);

  const handleR = useCallback(() => {
    engineRef.current.reset();
  }, []);

  const handleHome = useCallback(() => {
    window.location.hash = '/';
  }, []);

  const handleHomeAfterGameOver = useCallback(() => {
    engineRef.current.reset();
    window.location.hash = '/';
  }, []);

  const handleSubmitScore = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error('未登录');
    await api.submitScore(token, {
      score: gameState.score,
      snakeLength: gameState.snake.segments.length,
      gameDuration: gameState.duration,
    });
  }, [getToken, gameState]);

  useKeyboard({
    onDirection: handleDirection,
    onSpace: handleSpace,
    onR: handleR,
    onEscape: handleHome,
  });

  const statusLabel =
    gameState.status === 'idle'
      ? '按任意键开始'
      : gameState.status === 'running'
        ? '游戏中'
        : gameState.status === 'paused'
          ? '已暂停'
          : '游戏结束';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: GAME_BG,
        color: TEXT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <button onClick={handleHome} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>← 返回首页</button>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>贪吃蛇</span>
        <ScoreDisplay currentScore={gameState.score} highestScore={user?.highestScore} />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 24, padding: 24 }}>
        {/* Game canvas */}
        <div>
          <GameCanvas state={gameState} skinId={skinId} />
          <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: TEXT_SECONDARY, marginTop: 8 }}>
            <span>长度: {gameState.snake.segments.length}</span>
            <span style={{ color: gameState.status === 'gameover' ? NEON_PINK : gameState.status === 'running' ? NEON_GREEN : TEXT_SECONDARY }}>{statusLabel}</span>
            <span>速度: {gameState.speed}ms</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 200, background: PANEL_BG, borderRadius: 8, padding: 16, height: CANVAS_SIZE }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>最高分</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: NEON_GREEN }}>{gameState.score}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={handleSpace} style={{ flex: 1, padding: '6px 0', background: NEON_BLUE, border: 'none', borderRadius: 4, color: GAME_BG, fontWeight: 'bold', cursor: 'pointer' }}>{gameState.status === 'paused' ? '继续' : '暂停'}</button>
            <button onClick={handleR} style={{ flex: 1, padding: '6px 0', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT_SECONDARY, cursor: 'pointer' }}>重玩</button>
          </div>
          <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>
            <div style={{ fontWeight: 'bold', color: TEXT, marginBottom: 8 }}>操作说明</div>
            <div>方向键 / WASD 移动</div>
            <div>Space 暂停/继续</div>
            <div>R 重新开始</div>
            <div>Esc 返回首页</div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState.status === 'gameover' && (
        <GameOverModal
          score={gameState.score}
          snakeLength={gameState.snake.segments.length}
          duration={gameState.duration}
          onReplay={handleR}
          onHome={handleHomeAfterGameOver}
          onSubmitScore={handleSubmitScore}
        />
      )}
    </div>
  );
}
