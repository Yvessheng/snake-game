import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { AchievementInfo } from '../services/api';
import { soundManager } from '../services/soundManager';
import { SKINS } from '../types/skins';
import type { SkinId } from '../types/skins';
import { loadSkin, saveSkin } from '../types/skins';

const BG = '#0D1117';
const CARD_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_GREEN = '#00FF88';
const NEON_BLUE = '#00D4FF';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [rank, setRank] = useState<number | null>(null);
  const [skinId, setSkinId] = useState<SkinId>(() => loadSkin());
  const [achievements, setAchievements] = useState<AchievementInfo[]>([]);
  const [volume, setVolume] = useState(() => soundManager.getVolume());

  useEffect(() => {
    const token = localStorage.getItem('snake_token');
    if (token) {
      api.getMyRank(token).then((r) => setRank(r.rank)).catch(() => {});
      api.getAchievements(token).then((r) => setAchievements(r.achievements)).catch(() => {});
    }
  }, []);

  if (!user) {
    window.location.hash = '/login';
    return null;
  }

  const stats = [
    { label: '总场次', value: user.totalGames.toString() },
    { label: '最高分', value: user.highestScore.toString(), highlight: true },
    { label: '总分数', value: user.totalScore.toString() },
    { label: '总排名', value: rank !== null ? `#${rank}` : '加载中' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      {/* Header */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => (window.location.hash = '/')} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>← 返回首页</button>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>个人资料</span>
        <div />
      </div>

      {/* Profile */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
        {/* User info */}
        <div style={{ background: CARD_BG, borderRadius: 8, padding: 24, border: `1px solid ${BORDER}`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: NEON_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: BG }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{user.username}</div>
            <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>{user.email}</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>退出登录</button>
        </div>

        {/* Stats */}
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>游戏统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: CARD_BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: s.highlight ? NEON_GREEN : TEXT }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Skin selector */}
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>蛇皮肤</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => {
                setSkinId(skin.id);
                saveSkin(skin.id);
              }}
              style={{
                padding: 12,
                background: CARD_BG,
                border: `2px solid ${skinId === skin.id ? skin.head : BORDER}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: skinId === skin.id ? `0 0 8px ${skin.glow}` : 'none',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: 4, background: skin.head, margin: '0 auto 4px' }} />
              <div style={{ fontSize: 10, color: TEXT_SECONDARY }}>{skin.name}</div>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>成就</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
          {achievements.map((a) => (
            <div
              key={a.key}
              style={{
                background: a.unlockedAt ? '#1A3A2A' : CARD_BG,
                borderRadius: 8,
                padding: 12,
                border: `1px solid ${a.unlockedAt ? NEON_GREEN : BORDER}`,
                opacity: a.unlockedAt ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 'bold', color: a.unlockedAt ? NEON_GREEN : TEXT_SECONDARY, marginBottom: 4 }}>
                {a.unlockedAt ? '🏆' : '🔒'} {a.name}
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{a.description}</div>
              {a.unlockedAt && <div style={{ fontSize: 10, color: NEON_GREEN, marginTop: 4 }}>{new Date(a.unlockedAt).toLocaleDateString('zh-CN')}</div>}
            </div>
          ))}
        </div>

        {/* Sound volume */}
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>音量</h3>
        <div style={{ background: CARD_BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 24, cursor: 'pointer', width: 32, textAlign: 'center' }} onClick={() => { soundManager.toggleMute(); setVolume(soundManager.getVolume()); }}>
            {soundManager.getVolume() === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              soundManager.setVolume(v);
              setVolume(v);
            }}
            style={{ flex: 1, accentColor: NEON_GREEN }}
          />
          <span style={{ fontSize: 14, color: TEXT_SECONDARY, width: 40 }}>{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
