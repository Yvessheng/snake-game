import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { RankNotification } from '../hooks/useWebSocket';
import { NotificationPanel } from '../components/ui/NotificationPanel';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../types/theme';

const btnBase = {
  padding: '6px 16px',
  borderRadius: theme.radius.sm,
  fontWeight: 600 as const,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  border: `1px solid ${theme.border.default}`,
  background: theme.bg.surface,
  color: theme.text.primary,
  outline: 'none',
};

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
    <div style={{ minHeight: '100vh', background: theme.bg.page, color: theme.text.primary, padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>排行榜</h2>
          {ws.connected && <span style={{ fontSize: 11, color: theme.accent.green, background: `${theme.accent.green}15`, padding: '2px 8px', borderRadius: 10 }}>实时</span>}
        </div>
        <button onClick={() => (window.location.hash = '/')} style={{ ...btnBase, background: 'transparent', color: theme.text.secondary }}>← 首页</button>
      </div>

      <NotificationPanel
        notifications={ws.notifications as RankNotification[]}
        onDismiss={ws.dismiss}
        onClearAll={ws.clearAll}
      />

      {/* Table */}
      <div style={{ background: theme.bg.surface, borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 18px', borderBottom: `1px solid ${theme.border.subtle}`, fontSize: 11, color: theme.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ width: 80 }}>排名</span>
          <span style={{ flex: 1 }}>玩家</span>
          <span style={{ width: 100, textAlign: 'right' }}>最高分</span>
          <span style={{ width: 80, textAlign: 'right' }}>场次</span>
        </div>
        {entries.map((entry, i) => {
          const rank = (page - 1) * LIMIT + i + 1;
          const isCurrentUser = user && entry.id === user.id;
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                padding: '10px 18px',
                borderBottom: `1px solid ${theme.border.subtle}`,
                background: isCurrentUser ? `${theme.accent.blue}10` : 'transparent',
                borderLeft: isCurrentUser ? `2px solid ${theme.accent.blue}` : '2px solid transparent',
              }}
            >
              <span style={{ width: 80, display: 'flex', alignItems: 'center' }}>
                {rank <= 3 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: medals[rank - 1] + '18', color: medals[rank - 1], fontSize: 12, fontWeight: 800 }}>
                    {rank}
                  </span>
                ) : (
                  <span style={{ color: theme.text.muted, fontSize: 14 }}>{rank}</span>
                )}
              </span>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', color: theme.text.primary }}>
                {entry.username}
                {isCurrentUser && <span style={{ color: theme.accent.blue, marginLeft: 8, fontSize: 11, fontWeight: 600 }}>你</span>}
              </span>
              <span style={{ width: 100, textAlign: 'right', color: theme.accent.green, fontWeight: 700 }}>{entry.highestScore}</span>
              <span style={{ width: 80, textAlign: 'right', color: theme.text.muted }}>{entry.totalGames}</span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>上一页</button>
          <span style={{ padding: '6px 12px', color: theme.text.muted, fontSize: 13 }}>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>下一页</button>
        </div>
      )}
    </div>
  );
}
