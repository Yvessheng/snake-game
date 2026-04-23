import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { AchievementInfo } from '../services/api';
import { soundManager } from '../services/soundManager';
import { SKINS } from '../types/skins';
import type { SkinId } from '../types/skins';
import { loadSkin, saveSkin } from '../types/skins';
import { theme } from '../types/theme';

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
    { label: '最高分', value: user.highestScore.toString(), accent: theme.accent.green },
    { label: '总场次', value: user.totalGames.toString(), accent: theme.text.primary },
    { label: '总分数', value: user.totalScore.toString(), accent: theme.text.primary },
    { label: '总排名', value: rank !== null ? `#${rank}` : '加载中', accent: theme.accent.blue },
  ];

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary }}>
      {/* Win98 Title bar */}
      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', background: theme.titleBar.active, borderBottom: `1px solid ${theme.border.default}`, userSelect: 'none' }}>
        <button onClick={() => (window.location.hash = '/')} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', padding: '1px 8px', cursor: 'pointer', fontSize: 11, outline: 'none' }}>← 首页</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text.inverse }}>个人资料</span>
        <div />
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px' }}>
        {/* User info - Win98 dialog */}
        <div style={{ background: theme.bg.surface, border: theme.bevel.raised, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, background: theme.accent.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0, border: theme.bevel.sunken }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{user.username}</div>
            <div style={{ fontSize: 11, color: theme.text.secondary }}>{user.email}</div>
            <div style={{ fontSize: 10, color: theme.text.muted, marginTop: 2 }}>注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
          <button onClick={logout} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', padding: '3px 10px', cursor: 'pointer', fontSize: 11, outline: 'none' }}>退出</button>
        </div>

        {/* Stats grid */}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.text.primary, marginBottom: 8 }}>游戏统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: theme.bg.surface, border: theme.bevel.raised, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.text.muted, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.accent, fontFamily: '"MS Sans Serif", "Tahoma", "SimSun", monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Skin selector */}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.text.primary, marginBottom: 8 }}>蛇皮肤</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => { setSkinId(skin.id); saveSkin(skin.id); }}
              style={{
                padding: 8,
                background: theme.bg.surface,
                border: skinId === skin.id ? '2px inset #FFFFFF' : '2px outset #FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
                outline: 'none',
              }}
            >
              <div style={{ width: 24, height: 24, background: `linear-gradient(135deg, ${skin.head}, ${skin.body})`, margin: '0 auto 4px', border: `1px solid ${skin.head}` }} />
              <div style={{ fontSize: 10, color: skinId === skin.id ? theme.text.primary : theme.text.muted }}>{skin.name}</div>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.text.primary, marginBottom: 8 }}>成就</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 20 }}>
          {achievements.map((a) => (
            <div
              key={a.key}
              style={{
                background: a.unlockedAt ? '#FFFFFF' : theme.bg.surface,
                border: a.unlockedAt ? '2px inset #FFFFFF' : theme.bevel.raised,
                padding: 8,
                opacity: a.unlockedAt ? 1 : 0.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                {a.unlockedAt ? (
                  <span style={{ color: theme.accent.green, fontSize: 12 }}>★</span>
                ) : (
                  <span style={{ color: theme.text.muted, fontSize: 12 }}>🔒</span>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: a.unlockedAt ? theme.accent.green : theme.text.muted }}>{a.name}</span>
              </div>
              <div style={{ fontSize: 10, color: theme.text.muted }}>{a.description}</div>
              {a.unlockedAt && <div style={{ fontSize: 9, color: theme.accent.green, marginTop: 2 }}>{new Date(a.unlockedAt).toLocaleDateString('zh-CN')}</div>}
            </div>
          ))}
        </div>

        {/* Sound volume */}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.text.primary, marginBottom: 8 }}>音量</h3>
        <div style={{ background: theme.bg.surface, border: theme.bevel.raised, padding: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { soundManager.toggleMute(); setVolume(soundManager.getVolume()); }}
            style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '3px 8px', cursor: 'pointer', color: '#000', fontSize: 12, outline: 'none' }}
          >
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => { const v = parseFloat(e.target.value); soundManager.setVolume(v); setVolume(v); }}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 11, color: theme.text.muted, width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
