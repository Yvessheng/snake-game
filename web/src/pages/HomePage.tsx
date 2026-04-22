import { useState, useEffect } from 'react';
import type { User, LeaderboardEntry } from '../types';
import { api } from '../services/api';

const BG = '#0D1117';
const CARD_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_GREEN = '#00FF88';
const NEON_BLUE = '#00D4FF';

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

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: 24, margin: 0, color: NEON_GREEN }}>SNAKE</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={onGoToLeaderboard} style={{ background: 'none', border: 'none', color: TEXT, cursor: 'pointer', fontSize: 14 }}>排行榜</button>
          {user ? (
            <>
              <span onClick={onGoToProfile} style={{ color: TEXT, cursor: 'pointer', fontSize: 14 }}>{user.username}</span>
              <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>退出</button>
            </>
          ) : (
            <>
              <button onClick={onGoToLogin} style={{ background: 'none', border: 'none', color: NEON_BLUE, cursor: 'pointer', fontSize: 14 }}>登录</button>
              <button onClick={onGoToRegister} style={{ background: NEON_BLUE, border: 'none', color: BG, padding: '4px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>注册</button>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <h2 style={{ fontSize: 48, margin: '0 0 8px', color: NEON_GREEN }}>SNAKE</h2>
        <p style={{ color: TEXT_SECONDARY, fontSize: 18, marginBottom: 48 }}>单机贪吃蛇 + 在线排行榜</p>
        <button
          onClick={onGoToGame}
          style={{ padding: '16px 64px', fontSize: 24, fontWeight: 'bold', background: NEON_BLUE, border: 'none', borderRadius: 8, color: BG, cursor: 'pointer', boxShadow: '0 0 16px rgba(0, 212, 255, 0.6)' }}
        >
          开始游戏
        </button>
      </div>

      {/* Bottom: Leaderboard preview + stats */}
      <div style={{ display: 'flex', gap: 32, padding: '0 32px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {/* Leaderboard */}
        <div style={{ flex: 1, background: CARD_BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, color: NEON_BLUE }}>排行榜 Top 10</h3>
          {top10.map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 9 ? `1px solid ${BORDER}` : 'none', fontSize: 14 }}>
              <span>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`} {entry.username}
              </span>
              <span style={{ color: NEON_GREEN, fontWeight: 'bold' }}>{entry.highestScore}</span>
            </div>
          ))}
          <button onClick={onGoToLeaderboard} style={{ marginTop: 12, background: 'none', border: 'none', color: NEON_BLUE, cursor: 'pointer', fontSize: 14 }}>查看完整排行榜 →</button>
        </div>

        {/* Stats */}
        <div style={{ width: 240, background: CARD_BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, color: NEON_BLUE }}>我的统计</h3>
          {user ? (
            <>
              <div style={{ marginBottom: 8 }}><span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>最高分</span><div style={{ fontSize: 20, fontWeight: 'bold', color: NEON_GREEN }}>{user.highestScore}</div></div>
              <div style={{ marginBottom: 8 }}><span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>总场次</span><div style={{ fontSize: 20, fontWeight: 'bold' }}>{user.totalGames}</div></div>
              <div><span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>总分数</span><div style={{ fontSize: 20, fontWeight: 'bold' }}>{user.totalScore}</div></div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: TEXT_SECONDARY, padding: 24 }}>
              <p>登录后查看统计数据</p>
              <button onClick={onGoToLogin} style={{ marginTop: 12, background: NEON_BLUE, border: 'none', color: BG, padding: '6px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>登录</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
