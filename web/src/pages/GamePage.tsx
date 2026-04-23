import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../services/gameEngine';
import type { GameState } from '../services/gameEngine';
import { GameCanvas } from '../components/game/GameCanvas';
import { ScoreDisplay } from '../components/ui/ScoreDisplay';
import { useKeyboard } from '../hooks/useKeyboard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { soundManager } from '../services/soundManager';
import { CANVAS_SIZE, ZONES, getZoneConfig, getFoodConfig, FOOD_TYPES } from '../types/game';
import type { FoodTypeId } from '../types/game';
import type { SkinId } from '../types/skins';
import { loadSkin } from '../types/skins';
import { theme } from '../types/theme';

interface RewardNotification {
  id: number;
  text: string;
  score: number;
  timestamp: number;
}

let rewardIdCounter = 0;

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: theme.bg.surface, border: theme.bevel.raised, width: 300 }}>
        <div style={{ background: theme.titleBar.active, color: theme.text.inverse, padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, userSelect: 'none' }}>
          <span style={{ padding: '0 2px' }}>游戏结束</span>
        </div>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: theme.accent.green, marginBottom: 12, lineHeight: 1, background: '#FFFFFF', border: theme.bevel.sunken, padding: '8px 0' }}>{score}</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, fontSize: 12, color: theme.text.secondary }}>
            <div>长度: {snakeLength}</div>
            <div>时长: {min}m {sec}s</div>
          </div>
          {error && <div style={{ color: theme.accent.pink, fontSize: 11, marginBottom: 8, padding: '3px 6px', background: '#FFFFFF', border: theme.bevel.sunken }}>{error}</div>}
          {submitted && <div style={{ color: theme.accent.green, fontSize: 11, marginBottom: 8 }}>分数已提交!</div>}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button onClick={onReplay} style={{ flex: 1, padding: '5px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none' }}>再来一局</button>
            {isAuthenticated && !submitted && (
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '5px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontWeight: 700, fontSize: 12, cursor: submitting ? 'not-allowed' : 'pointer', outline: 'none' }}>{submitting ? '提交中...' : '提交分数'}</button>
            )}
          </div>
          {isAuthenticated && submitted && (
            <button onClick={onHome} style={{ width: '100%', padding: '5px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontSize: 12, cursor: 'pointer', outline: 'none', marginBottom: 4 }}>返回首页</button>
          )}
          {!isAuthenticated && <p style={{ fontSize: 11, color: theme.text.muted, margin: '4px 0 0' }}>登录后可以提交分数</p>}
        </div>
      </div>
    </div>
  );
}

export function GamePage() {
  const { user, getToken } = useAuth();
  const [skinId] = useState<SkinId>(() => loadSkin());
  const [gameState, setGameState] = useState<GameState>(() => new GameEngine().getState());
  const engineRef = useRef<GameEngine>(new GameEngine(setGameState));
  const [zoneNotifications, setZoneNotifications] = useState<Array<{zoneName: string; timestamp: number}>>([]);
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotification[]>([]);
  const currentZoneRef = useRef(gameState.currentZone);
  currentZoneRef.current = gameState.currentZone;

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleGameEvent = useCallback((type: string, data?: unknown) => {
    if (type === 'eat') {
      const eatData = data as { type: FoodTypeId } | undefined;
      soundManager.play('eat', eatData?.type);
      if (eatData?.type) {
        const config = getFoodConfig(eatData.type);
        rewardIdCounter++;
        setRewardNotifications((prev) => [
          ...prev,
          { id: rewardIdCounter, text: `${config.icon} ${config.name}`, score: config.score, timestamp: Date.now() },
        ]);
      }
    } else if (type === 'die') {
      soundManager.play('die');
    } else if (type === 'start') {
      soundManager.play('start');
    } else if (type === 'zone_unlock') {
      const zoneData = data as { zone: string } | undefined;
      if (zoneData?.zone) {
        const config = getZoneConfig(zoneData.zone as never);
        setZoneNotifications((prev) => [
          ...prev,
          { zoneName: config.name, timestamp: Date.now() },
        ]);
        soundManager.play('zone_unlock');
      }
    }
  }, []);

  useEffect(() => {
    engineRef.current = new GameEngine(handleStateChange, handleGameEvent);
    return () => engineRef.current.destroy();
  }, [handleStateChange, handleGameEvent]);

  // Auto-dismiss notifications after 2s
  useEffect(() => {
    const timer = setInterval(() => {
      setZoneNotifications((prev) => prev.filter((n) => Date.now() - n.timestamp < 5000));
      setRewardNotifications((prev) => prev.filter((n) => Date.now() - n.timestamp < 2000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleDirection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const engine = engineRef.current;
      if (engine.getState().status === 'idle') engine.start();
      engine.setDirection(dir);
    },
    [],
  );

  const handleSpace = useCallback(() => {
    const engine = engineRef.current;
    const status = engine.getState().status;
    if (status === 'running') engine.pause();
    else if (status === 'paused') engine.resume();
    else if (status === 'idle') engine.start();
  }, []);

  const handleR = useCallback(() => {
    engineRef.current.reset();
    setZoneNotifications([]);
    setRewardNotifications([]);
  }, []);

  const handleHome = useCallback(() => { window.location.hash = '/'; }, []);
  const handleHomeAfterGameOver = useCallback(() => { engineRef.current.reset(); window.location.hash = '/'; }, []);

  const handleSubmitScore = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error('未登录');
    await api.submitScore(token, {
      score: gameState.score,
      snakeLength: gameState.snake.segments.length,
      gameDuration: gameState.duration,
    });
  }, [getToken, gameState]);

  useKeyboard({ onDirection: handleDirection, onSpace: handleSpace, onR: handleR, onEscape: handleHome });

  const currentZone = getZoneConfig(gameState.currentZone);
  const nextZone = ZONES.find((z) => !gameState.unlockedZones.includes(z.id));
  const progressPercent = nextZone
    ? Math.min(100, ((gameState.snake.segments.length - (nextZone.unlockLength - 7)) / 7) * 100)
    : 100;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary, display: 'flex', flexDirection: 'column' }}>
      {/* Title bar */}
      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', background: theme.titleBar.active, borderBottom: `1px solid ${theme.border.default}`, userSelect: 'none' }}>
        <button onClick={handleHome} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', padding: '1px 8px', cursor: 'pointer', fontSize: 11, outline: 'none' }}>← 首页</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text.inverse }}>{currentZone.name}</span>
        <ScoreDisplay currentScore={gameState.score} highestScore={user?.highestScore} />
      </div>

      {/* Notifications area between title bar and game */}
      <div style={{ position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Zone unlock */}
        {zoneNotifications.map((n, i) => (
          <div key={'z' + n.timestamp + i} style={{ background: theme.bg.surface, border: '3px outset #FFFFFF', padding: '6px 20px', fontSize: 14, color: theme.text.primary, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center' }}>
            🎉 新区域解锁: {n.zoneName}
          </div>
        ))}
        {/* Reward notifications */}
        {rewardNotifications.map((n) => (
          <div key={'r' + n.id} style={{ background: '#FFFFFF', border: '3px outset #C0C0C0', padding: '6px 20px', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', color: '#000' }}>
            {n.text} <span style={{ color: '#008000', fontWeight: 700 }}>+{n.score}</span>
          </div>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <div style={{ transform: 'scale(1.3)', transformOrigin: 'center center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Canvas */}
            <div>
              <div style={{ border: theme.bevel.sunken, background: '#FFFFFF' }}>
                <GameCanvas state={gameState} skinId={skinId} />
              </div>
              <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: theme.text.secondary, marginTop: 4 }}>
                <span>长度 <b style={{ color: theme.text.primary }}>{gameState.snake.segments.length}</b></span>
                {gameState.combo > 1 && <span style={{ color: theme.accent.yellow, fontWeight: 700 }}>🔥 Combo x{gameState.combo}</span>}
                <span>速度 <b style={{ color: theme.text.primary }}>{gameState.speed}ms</b></span>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ width: 170, background: theme.bg.surface, border: theme.bevel.raised, padding: 6, height: CANVAS_SIZE, display: 'flex', flexDirection: 'column', fontSize: 11 }}>
              {/* Score */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: theme.text.muted, marginBottom: 1 }}>分数</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent.green, background: '#FFFFFF', border: theme.bevel.sunken, padding: '2px 4px', fontFamily: '"MS Sans Serif", "Tahoma", "SimSun", monospace' }}>{gameState.score}</div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                <button onClick={handleSpace} style={{ flex: 1, padding: '2px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontSize: 10, cursor: 'pointer', outline: 'none' }}>{gameState.status === 'paused' ? '继续' : '暂停'}</button>
                <button onClick={handleR} style={{ flex: 1, padding: '2px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontSize: 10, cursor: 'pointer', outline: 'none' }}>重玩</button>
              </div>

              {/* Zone progress */}
              {nextZone && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: theme.text.muted, marginBottom: 1 }}>解锁: {nextZone.name}</div>
                  <div style={{ height: 8, background: '#FFFFFF', border: theme.bevel.sunken, padding: 1 }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, progressPercent))}%`, background: theme.accent.blue }} />
                  </div>
                </div>
              )}

              {/* Active effects */}
              {gameState.activeEffects.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: theme.text.muted, marginBottom: 2 }}>效果</div>
                  {gameState.activeEffects.map((e, _i) => (
                    <div key={_i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.text.primary }}>
                      <span>{e.type === 'speedBoost' ? '⚡加速' : e.type === 'shield' ? '🛡护盾' : '🌀随机'}</span>
                      <span style={{ fontFamily: 'monospace' }}>{Math.ceil(e.remainingTicks / 8)}s</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Food collection */}
              <div style={{ marginBottom: 6, flex: 1 }}>
                <div style={{ fontSize: 10, color: theme.text.muted, marginBottom: 2 }}>食物图鉴</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {FOOD_TYPES.map((f) => {
                    const collected = gameState.collectedFoodTypes.includes(f.id);
                    return (
                      <div key={f.id} style={{
                        textAlign: 'center', padding: '2px 0',
                        opacity: collected ? 1 : 0.3,
                        background: collected ? '#FFFFFF' : 'transparent',
                        border: collected ? theme.bevel.sunken : '1px solid #808080',
                      }}>
                        <span style={{ fontSize: 10 }}>{f.icon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div style={{ fontSize: 10, color: theme.text.muted, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: theme.text.primary, marginBottom: 2 }}>操作</div>
                <div><kbd style={{ background: '#FFFFFF', padding: '0 2px', fontSize: 9, border: theme.bevel.sunken }}>↑↓←→</kbd> 移动</div>
                <div><kbd style={{ background: '#FFFFFF', padding: '0 2px', fontSize: 9, border: theme.bevel.sunken }}>Space</kbd> 暂停</div>
                <div><kbd style={{ background: '#FFFFFF', padding: '0 2px', fontSize: 9, border: theme.bevel.sunken }}>R</kbd> 重玩</div>
              </div>
            </div>
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
