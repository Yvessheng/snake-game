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
import { theme } from '../types/theme';

// Button base styles
const btnBase = {
  padding: '8px 16px',
  borderRadius: theme.radius.sm,
  fontWeight: 600 as const,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  border: 'none',
  outline: 'none',
};

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: theme.bg.surface, border: `1px solid ${theme.border.default}`, borderRadius: theme.radius.lg, padding: 32, width: 340, textAlign: 'center', boxShadow: theme.shadow.modal }}>
        <h2 style={{ color: theme.accent.pink, marginBottom: 12, fontSize: 22, fontWeight: 700 }}>游戏结束</h2>
        <div style={{ fontSize: 56, fontWeight: 800, color: theme.accent.green, marginBottom: 16, lineHeight: 1 }}>{score}</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24, fontSize: 13, color: theme.text.secondary }}>
          <div>长度: {snakeLength}</div>
          <div>时长: {min}m {sec}s</div>
        </div>
        {error && <div style={{ color: theme.accent.pink, fontSize: 12, marginBottom: 12, padding: '8px 12px', background: `${theme.accent.pink}15`, borderRadius: theme.radius.sm }}>{error}</div>}
        {submitted && <div style={{ color: theme.accent.green, fontSize: 12, marginBottom: 12 }}>分数已提交!</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={onReplay} style={{ ...btnBase, flex: 1, background: theme.accent.blue, color: '#fff' }}>再来一局</button>
          {isAuthenticated && !submitted && (
            <button onClick={handleSubmit} disabled={submitting} style={{ ...btnBase, flex: 1, background: theme.accent.green, color: '#0A0A0F', cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? '提交中...' : '提交分数'}</button>
          )}
        </div>
        {isAuthenticated && submitted && (
          <button onClick={onHome} style={{ width: '100%', ...btnBase, background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.secondary, marginBottom: 8 }}>返回首页</button>
        )}
        {!isAuthenticated && <p style={{ fontSize: 12, color: theme.text.muted, margin: '8px 0 0' }}>登录后可以提交分数</p>}
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

  const statusColor =
    gameState.status === 'gameover' ? theme.accent.pink :
    gameState.status === 'running' ? theme.accent.green :
    theme.text.secondary;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${theme.border.subtle}` }}>
        <button onClick={handleHome} style={{ background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.secondary, padding: '6px 14px', borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13, transition: 'all 150ms ease' }}>← 首页</button>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>贪吃蛇</span>
        <ScoreDisplay currentScore={gameState.score} highestScore={user?.highestScore} />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 20, padding: 24 }}>
        {/* Game canvas area */}
        <div>
          <div style={{ borderRadius: theme.radius.md, overflow: 'hidden', border: `1px solid ${theme.border.default}`, boxShadow: theme.shadow.card }}>
            <GameCanvas state={gameState} skinId={skinId} />
          </div>
          <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: theme.text.secondary, marginTop: 10 }}>
            <span>长度 <b style={{ color: theme.text.primary }}>{gameState.snake.segments.length}</b></span>
            <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
            <span>速度 <b style={{ color: theme.text.primary }}>{gameState.speed}ms</b></span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 200, background: theme.bg.surface, borderRadius: theme.radius.md, padding: 16, height: CANVAS_SIZE, border: `1px solid ${theme.border.subtle}`, boxShadow: theme.shadow.card }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>分数</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent.green }}>{gameState.score}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            <button onClick={handleSpace} style={{ ...btnBase, flex: 1, background: theme.accent.blue, color: '#fff' }}>{gameState.status === 'paused' ? '继续' : '暂停'}</button>
            <button onClick={handleR} style={{ ...btnBase, flex: 1, background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.secondary }}>重玩</button>
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: theme.text.secondary, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>操作说明</div>
            <div><kbd style={{ background: theme.bg.elevated, padding: '1px 5px', borderRadius: 3, fontSize: 11, border: `1px solid ${theme.border.subtle}` }}>↑↓←→</kbd> 移动</div>
            <div><kbd style={{ background: theme.bg.elevated, padding: '1px 5px', borderRadius: 3, fontSize: 11, border: `1px solid ${theme.border.subtle}` }}>Space</kbd> 暂停</div>
            <div><kbd style={{ background: theme.bg.elevated, padding: '1px 5px', borderRadius: 3, fontSize: 11, border: `1px solid ${theme.border.subtle}` }}>R</kbd> 重玩</div>
            <div><kbd style={{ background: theme.bg.elevated, padding: '1px 5px', borderRadius: 3, fontSize: 11, border: `1px solid ${theme.border.subtle}` }}>Esc</kbd> 首页</div>
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
