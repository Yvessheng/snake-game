import { useState, useEffect } from 'react';
import type { User, LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { theme } from '../types/theme';

const btnBase = {
  padding: '8px 18px',
  borderRadius: theme.radius.sm,
  fontWeight: 600 as const,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  border: 'none',
  outline: 'none',
};

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
      {/* Header */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `1px solid ${theme.border.subtle}` }}>
        <h1 style={{ fontSize: 20, margin: 0, fontWeight: 800, letterSpacing: 2, color: theme.accent.green }}>SNAKE</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onGoToLeaderboard} style={{ ...btnBase, background: 'transparent', color: theme.text.secondary, fontWeight: 500 }}>排行榜</button>
          {user ? (
            <>
              <span onClick={onGoToProfile} style={{ color: theme.text.primary, cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '4px 10px', borderRadius: theme.radius.sm, transition: 'background 150ms' }}>{user.username}</span>
              <button onClick={onLogout} style={{ ...btnBase, background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.muted, fontSize: 12 }}>退出</button>
            </>
          ) : (
            <>
              <button onClick={onGoToLogin} style={{ ...btnBase, background: 'transparent', color: theme.accent.blue }}>登录</button>
              <button onClick={onGoToRegister} style={{ ...btnBase, background: theme.accent.blue, color: '#fff' }}>注册</button>
            </>
          )}
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
        <h2 style={{ fontSize: 56, margin: 0, fontWeight: 900, letterSpacing: 4, color: theme.accent.green, textShadow: `0 0 40px ${theme.accent.green}30` }}>SNAKE</h2>
        <p style={{ color: theme.text.muted, fontSize: 16, margin: 0, marginBottom: 24 }}>单机贪吃蛇 · 在线排行榜</p>
        <button
          onClick={onGoToGame}
          style={{ ...btnBase, padding: '14px 56px', fontSize: 18, fontWeight: 700, background: theme.accent.blue, color: '#fff', borderRadius: theme.radius.md, boxShadow: `0 0 30px ${theme.accent.blue}25` }}
        >
          开始游戏
        </button>
      </div>

      {/* Bottom cards */}
      <div style={{ display: 'flex', gap: 20, padding: '0 28px 28px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {/* Leaderboard preview */}
        <div style={{ flex: 1, background: theme.bg.surface, borderRadius: theme.radius.md, padding: 20, border: `1px solid ${theme.border.subtle}` }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: theme.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>排行榜 Top 10</h3>
          {top10.map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: i < 9 ? `1px solid ${theme.border.subtle}` : 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                {i < 3 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: medals[i] + '20', color: medals[i], fontSize: 11, fontWeight: 800 }}>
                    {i + 1}
                  </span>
                ) : (
                  <span style={{ width: 22, textAlign: 'center', color: theme.text.muted, fontSize: 13 }}>{i + 1}</span>
                )}
                <span style={{ color: theme.text.primary }}>{entry.username}</span>
              </span>
              <span style={{ color: theme.accent.green, fontWeight: 700, fontSize: 14 }}>{entry.highestScore}</span>
            </div>
          ))}
          <button onClick={onGoToLeaderboard} style={{ ...btnBase, marginTop: 14, background: 'transparent', color: theme.accent.blue, fontSize: 13, padding: '6px 0' }}>查看完整排行榜 →</button>
        </div>

        {/* Stats */}
        <div style={{ width: 220, background: theme.bg.surface, borderRadius: theme.radius.md, padding: 20, border: `1px solid ${theme.border.subtle}` }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: theme.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>我的统计</h3>
          {user ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: theme.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>最高分</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent.green }}>{user.highestScore}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: theme.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>总场次</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.text.primary }}>{user.totalGames}</div>
              </div>
              <div>
                <span style={{ color: theme.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>总分数</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.text.primary }}>{user.totalScore}</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: theme.text.muted, padding: '16px 0' }}>
              <p style={{ fontSize: 13, margin: 0 }}>登录后查看统计</p>
              <button onClick={onGoToLogin} style={{ ...btnBase, marginTop: 10, background: theme.accent.blue, color: '#fff', fontSize: 13 }}>登录</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
