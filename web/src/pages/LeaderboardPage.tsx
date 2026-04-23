import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { RankNotification } from '../hooks/useWebSocket';
import { NotificationPanel } from '../components/ui/NotificationPanel';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../types/theme';

export function LeaderboardPage() {
  const { getToken, user } = useAuth();
  const token = getToken();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    api.getLeaderboard(LIMIT, (page - 1) * LIMIT).then((r) => {
      setEntries(r.entries);
      setTotal(r.total);
    }).catch(() => {});
  }, [page]);

  const ws = useWebSocket(token);
  const totalPages = Math.ceil(total / LIMIT);
  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary, padding: '20px 16px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>排行榜</h2>
          {ws.connected && <span style={{ fontSize: 10, color: theme.accent.green, background: theme.bg.surface, border: theme.bevel.sunken, padding: '1px 6px' }}>实时</span>}
        </div>
        <button onClick={() => (window.location.hash = '/')} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', padding: '3px 12px', fontSize: 12, cursor: 'pointer', outline: 'none' }}>← 首页</button>
      </div>

      <NotificationPanel
        notifications={ws.notifications as RankNotification[]}
        onDismiss={ws.dismiss}
        onClearAll={ws.clearAll}
      />

      {/* Table - Win98 sunken list */}
      <div style={{ background: theme.bg.surface, border: theme.bevel.raised, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', padding: '4px 10px', borderBottom: `1px solid ${theme.border.default}`, fontSize: 11, color: theme.text.primary, fontWeight: 700, background: '#C0C0C0' }}>
          <span style={{ width: 50 }}>排名</span>
          <span style={{ flex: 1 }}>玩家</span>
          <span style={{ width: 70, textAlign: 'right' }}>分数</span>
          <span style={{ width: 50, textAlign: 'right' }}>长度</span>
          <span style={{ width: 70, textAlign: 'right' }}>时长</span>
          <span style={{ width: 80, textAlign: 'right' }}>时间</span>
        </div>
        <div style={{ background: theme.bg.elevated, border: theme.bevel.sunken, margin: 4, maxHeight: 500, overflow: 'auto' }}>
          {entries.map((entry, i) => {
            const rank = (page - 1) * LIMIT + i + 1;
            const isCurrentUser = user && entry.userId === user.id;
            const durationSec = Math.floor(entry.gameDuration / 1000);
            const min = Math.floor(durationSec / 60);
            const sec = durationSec % 60;
            const dateStr = entry.playedAt
              ? new Date(entry.playedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
              : '';
            return (
              <div
                key={entry.userId + '-' + entry.rank + '-' + entry.score}
                style={{
                  display: 'flex',
                  padding: '3px 10px',
                  borderBottom: `1px solid ${theme.border.subtle}`,
                  background: isCurrentUser ? theme.accent.blue : 'transparent',
                  fontSize: 12,
                }}
              >
                <span style={{ width: 50, display: 'flex', alignItems: 'center' }}>
                  {rank <= 3 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 18, background: medals[rank - 1], color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      {rank}
                    </span>
                  ) : (
                    <span style={{ color: theme.text.muted, fontSize: 12 }}>{rank}</span>
                  )}
                </span>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', color: isCurrentUser ? '#fff' : theme.text.primary }}>
                  {entry.username}
                  {isCurrentUser && <span style={{ color: '#fff', marginLeft: 6, fontSize: 10, fontWeight: 700 }}>你</span>}
                </span>
                <span style={{ width: 70, textAlign: 'right', color: theme.accent.green, fontWeight: 700 }}>{entry.score}</span>
                <span style={{ width: 50, textAlign: 'right', color: theme.text.secondary }}>{entry.snakeLength}</span>
                <span style={{ width: 70, textAlign: 'right', color: theme.text.muted }}>{min}m {sec}s</span>
                <span style={{ width: 80, textAlign: 'right', color: theme.text.muted, fontSize: 11 }}>{dateStr}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: page === 1 ? '#808080' : '#000', padding: '3px 12px', fontSize: 12, cursor: page === 1 ? 'not-allowed' : 'pointer', outline: 'none' }}>上一页</button>
          <span style={{ padding: '3px 10px', color: theme.text.muted, fontSize: 12 }}>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', color: page === totalPages ? '#808080' : '#000', padding: '3px 12px', fontSize: 12, cursor: page === totalPages ? 'not-allowed' : 'pointer', outline: 'none' }}>下一页</button>
        </div>
      )}
    </div>
  );
}
