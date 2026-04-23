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
      {/* Header */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${theme.border.subtle}` }}>
        <button onClick={() => (window.location.hash = '/')} style={{ background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.secondary, padding: '6px 14px', borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13 }}>← 首页</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>个人资料</span>
        <div />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        {/* User info card */}
        <div style={{ background: theme.bg.surface, borderRadius: theme.radius.md, padding: 24, border: `1px solid ${theme.border.subtle}`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent.blue}, ${theme.accent.purple || '#7C3AED'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user.username}</div>
            <div style={{ fontSize: 13, color: theme.text.secondary }}>{user.email}</div>
            <div style={{ fontSize: 11, color: theme.text.muted, marginTop: 2 }}>注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.muted, padding: '5px 14px', borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 12 }}>退出</button>
        </div>

        {/* Stats grid */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text.secondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>游戏统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: theme.bg.surface, borderRadius: theme.radius.md, padding: 16, border: `1px solid ${theme.border.subtle}`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.accent }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Skin selector */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text.secondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>蛇皮肤</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 28 }}>
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => { setSkinId(skin.id); saveSkin(skin.id); }}
              style={{
                padding: 14,
                background: skinId === skin.id ? `${skin.head}12` : theme.bg.surface,
                border: `2px solid ${skinId === skin.id ? skin.head : theme.border.subtle}`,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: skinId === skin.id ? `0 0 12px ${skin.glow}40` : 'none',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${skin.head}, ${skin.body})`, margin: '0 auto 6px', boxShadow: `0 2px 8px ${skin.glow}50` }} />
              <div style={{ fontSize: 10, color: skinId === skin.id ? theme.text.primary : theme.text.muted }}>{skin.name}</div>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text.secondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>成就</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 28 }}>
          {achievements.map((a) => (
            <div
              key={a.key}
              style={{
                background: a.unlockedAt ? `${theme.accent.green}08` : theme.bg.surface,
                borderRadius: theme.radius.md,
                padding: 12,
                border: `1px solid ${a.unlockedAt ? `${theme.accent.green}30` : theme.border.subtle}`,
                opacity: a.unlockedAt ? 1 : 0.45,
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {a.unlockedAt ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: a.unlockedAt ? theme.accent.green : theme.text.muted }}>{a.name}</span>
              </div>
              <div style={{ fontSize: 11, color: theme.text.muted }}>{a.description}</div>
              {a.unlockedAt && <div style={{ fontSize: 10, color: theme.accent.green, marginTop: 4 }}>{new Date(a.unlockedAt).toLocaleDateString('zh-CN')}</div>}
            </div>
          ))}
        </div>

        {/* Sound volume */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text.secondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>音量</h3>
        <div style={{ background: theme.bg.surface, borderRadius: theme.radius.md, padding: 16, border: `1px solid ${theme.border.subtle}`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => { soundManager.toggleMute(); setVolume(soundManager.getVolume()); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.secondary, display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {volume === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            ) : volume < 0.5 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => { const v = parseFloat(e.target.value); soundManager.setVolume(v); setVolume(v); }}
            style={{ flex: 1, accentColor: theme.accent.green }}
          />
          <span style={{ fontSize: 13, color: theme.text.muted, width: 36, textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
