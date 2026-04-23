import { useState, useCallback } from 'react';
import type { RankNotification } from '../../hooks/useWebSocket';
import { theme } from '../../types/theme';

interface NotificationPanelProps {
  notifications: RankNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationPanel({ notifications, onDismiss, onClearAll }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div style={{ position: 'fixed', top: 28, right: 4, zIndex: 999 }}>
      <button
        onClick={handleToggle}
        style={{
          background: '#C0C0C0',
          border: '2px outset #FFFFFF',
          width: 32,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: '#000',
          padding: 0,
          fontSize: 11,
        }}
      >
        🔔
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 14,
            height: 14,
            background: theme.accent.pink,
            color: '#fff',
            fontSize: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            padding: '0 2px',
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 28,
          right: 0,
          width: 280,
          maxHeight: 360,
          background: theme.bg.surface,
          border: theme.bevel.raised,
          overflow: 'auto',
        }}>
          <div style={{ background: theme.titleBar.active, color: theme.text.inverse, padding: '2px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, userSelect: 'none' }}>
            <span>排名通知</span>
            {notifications.length > 0 && (
              <button onClick={onClearAll} style={{ background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '0 6px', fontSize: 10, color: '#000', cursor: 'pointer', outline: 'none' }}>清空</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: theme.text.muted, fontSize: 12 }}>暂无通知</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.border.subtle}`, fontSize: 12 }}>
                <div style={{ color: theme.text.primary }}>
                  <span style={{ color: theme.accent.blue, fontWeight: 700 }}>{n.username}</span>
                  {' 以 '}
                  <span style={{ color: theme.accent.green, fontWeight: 700 }}>{n.score}</span>
                  {' 分 '}
                  {n.type === 'rank_up' ? '超越' : '被超越'}
                </div>
                <div style={{ fontSize: 11, color: theme.text.muted, marginTop: 2 }}>
                  排名: #{n.newRank}
                </div>
                <button onClick={() => onDismiss(n.id)} style={{ marginTop: 2, background: '#C0C0C0', border: '2px outset #FFFFFF', padding: '1px 6px', fontSize: 10, color: '#000', cursor: 'pointer', outline: 'none' }}>关闭</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
