import { useState, useEffect } from 'react';
import type { User, LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { theme } from '../types/theme';

interface HomePageProps {
  user: User | null;
  onLogout: () => void;
  onGoToGame: () => void;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onGoToLeaderboard: () => void;
  onGoToProfile: () => void;
}

export function HomePage({ user, onLogout, onGoToGame, onGoToLogin, onGoToRegister, onGoToLeaderboard, onGoToProfile }: HomePageProps) {
  const [top10, setTop10] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.getLeaderboard(10).then((r) => setTop10(r.entries)).catch(() => {});
  }, []);

  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary, display: 'flex', flexDirection: 'column' }}>
      {/* Header - Win98 title bar style */}
      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', background: theme.titleBar.active, borderBottom: `1px solid ${theme.border.default}`, userSelect: 'none' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text.inverse, padding: '0 4px' }}>贪吃蛇</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {user ? (
            <>
              <span onClick={onGoToProfile} style={{ color: theme.text.inverse, cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>{user.username}</span>
              <button onClick={onLogout} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '1px 8px', fontSize: 11, color: '#000', cursor: 'pointer', outline: 'none' }}>退出</button>
            </>
          ) : (
            <>
              <button onClick={onGoToLogin} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '1px 8px', fontSize: 11, color: '#000', cursor: 'pointer', outline: 'none' }}>登录</button>
              <button onClick={onGoToRegister} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '1px 8px', fontSize: 11, color: '#000', cursor: 'pointer', outline: 'none' }}>注册</button>
            </>
          )}
        </div>
      </div>

      {/* Hero area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        {/* Win98 dialog box */}
        <div style={{ background: theme.bg.surface, border: theme.bevel.raised, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 24, margin: 0, fontWeight: 700, color: theme.accent.blue }}>贪吃蛇</h2>
          <p style={{ color: theme.text.secondary, fontSize: 12, margin: 0 }}>单机贪吃蛇 · 在线排行榜</p>
          <button
            onClick={onGoToGame}
            style={{ padding: '8px 32px', fontSize: 14, fontWeight: 700, background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', cursor: 'pointer', outline: 'none' }}
          >
            开始游戏
          </button>
        </div>
      </div>

      {/* Bottom cards */}
      <div style={{ display: 'flex', gap: 16, padding: '0 20px 20px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {/* Leaderboard preview */}
        <div style={{ flex: 1, background: theme.bg.surface, border: theme.bevel.raised, padding: 12 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: theme.text.primary }}>排行榜 Top 10</h3>
          <div style={{ background: theme.bg.elevated, border: theme.bevel.sunken, overflow: 'auto', maxHeight: 240 }}>
            {top10.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: i < 9 ? `1px solid ${theme.border.subtle}` : 'none', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {i < 3 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: medals[i], color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                  ) : (
                    <span style={{ width: 18, textAlign: 'center', color: theme.text.muted, fontSize: 12 }}>{i + 1}</span>
                  )}
                  <span style={{ color: theme.text.primary }}>{entry.username}</span>
                </span>
                <span style={{ color: theme.accent.green, fontWeight: 700 }}>{entry.highestScore}</span>
              </div>
            ))}
          </div>
          <button onClick={onGoToLeaderboard} style={{ marginTop: 8, background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '3px 12px', fontSize: 12, color: '#000', cursor: 'pointer', outline: 'none' }}>查看完整排行榜 →</button>
        </div>

        {/* Stats */}
        <div style={{ width: 200, background: theme.bg.surface, border: theme.bevel.raised, padding: 12 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: theme.text.primary }}>我的统计</h3>
          {user ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: theme.text.muted, fontSize: 11 }}>最高分</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent.green }}>{user.highestScore}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: theme.text.muted, fontSize: 11 }}>总场次</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary }}>{user.totalGames}</div>
              </div>
              <div>
                <span style={{ color: theme.text.muted, fontSize: 11 }}>总分数</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary }}>{user.totalScore}</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: theme.text.muted, padding: '12px 0' }}>
              <p style={{ fontSize: 12, margin: 0 }}>登录后查看统计</p>
              <button onClick={onGoToLogin} style={{ marginTop: 8, background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '3px 12px', fontSize: 12, color: '#000', cursor: 'pointer', outline: 'none' }}>登录</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
