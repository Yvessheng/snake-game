import { useState, useCallback } from 'react';
import type { RankNotification } from '../../hooks/useWebSocket';

const CARD_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_GREEN = '#00FF88';
const NEON_BLUE = '#00D4FF';

interface NotificationPanelProps {
  notifications: RankNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationPanel({ notifications, onDismiss, onClearAll }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div style={{ position: 'fixed', top: 56, right: 16, zIndex: 999 }}>
      <button
        onClick={handleToggle}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          position: 'relative',
          color: TEXT,
        }}
      >
        🔔
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: NEON_GREEN,
            color: '#0D1117',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 36,
          right: 0,
          width: 300,
          maxHeight: 400,
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          overflow: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>排名通知</span>
            {notifications.length > 0 && (
              <button onClick={onClearAll} style={{ background: 'none', border: 'none', color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 12 }}>清空</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: TEXT_SECONDARY, fontSize: 14 }}>暂无通知</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: NEON_BLUE, fontWeight: 'bold' }}>{n.username}</span>
                  {' '}以{' '}
                  <span style={{ color: NEON_GREEN, fontWeight: 'bold' }}>{n.score}</span>
                  {' '}分{' '}
                  {n.type === 'rank_up' ? '超越' : '被超越'}
                </div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
                  排名: #{n.newRank}
                </div>
                <button onClick={() => onDismiss(n.id)} style={{ marginTop: 4, background: 'none', border: 'none', color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 12 }}>关闭</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
