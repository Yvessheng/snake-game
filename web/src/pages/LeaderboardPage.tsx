import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { RankNotification } from '../hooks/useWebSocket';
import { NotificationPanel } from '../components/ui/NotificationPanel';
import { useAuth } from '../hooks/useAuth';

const BG = '#0D1117';
const CARD_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_GREEN = '#00FF88';
const NEON_BLUE = '#00D4FF';

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

  // WebSocket notifications
  const ws = useWebSocket(token);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: NEON_BLUE }}>排行榜</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ws.connected && <span style={{ fontSize: 12, color: NEON_GREEN }}>● 实时</span>}
          <button onClick={() => (window.location.hash = '/')} style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>← 返回首页</button>
        </div>
      </div>

      {/* Notifications */}
      <NotificationPanel
        notifications={ws.notifications as RankNotification[]}
        onDismiss={ws.dismiss}
        onClearAll={ws.clearAll}
      />

      {/* Table */}
      <div style={{ background: CARD_BG, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: TEXT_SECONDARY, fontWeight: 'bold' }}>
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
                padding: '10px 16px',
                borderBottom: `1px solid ${BORDER}`,
                background: isCurrentUser ? 'rgba(0, 212, 255, 0.1)' : undefined,
              }}
            >
              <span style={{ width: 80 }}>{rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}</span>
              <span style={{ flex: 1 }}>
                {entry.username}
                {isCurrentUser && <span style={{ color: NEON_BLUE, marginLeft: 8, fontSize: 12 }}>你</span>}
              </span>
              <span style={{ width: 100, textAlign: 'right', color: NEON_GREEN, fontWeight: 'bold' }}>{entry.highestScore}</span>
              <span style={{ width: 80, textAlign: 'right', color: TEXT_SECONDARY }}>{entry.totalGames}</span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ background: page === 1 ? 'none' : CARD_BG, border: `1px solid ${BORDER}`, color: TEXT, padding: '6px 16px', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
          <span style={{ padding: '6px 12px', color: TEXT_SECONDARY }}>{page}/{totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ background: page === totalPages ? 'none' : CARD_BG, border: `1px solid ${BORDER}`, color: TEXT, padding: '6px 16px', borderRadius: 4, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>下一页</button>
        </div>
      )}
    </div>
  );
}
