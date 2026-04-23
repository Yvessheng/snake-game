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
    <div style={{ position: 'fixed', top: 56, right: 16, zIndex: 999 }}>
      <button
        onClick={handleToggle}
        style={{
          background: theme.bg.surface,
          border: `1px solid ${theme.border.default}`,
          borderRadius: theme.radius.sm,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: theme.text.secondary,
          transition: 'all 150ms ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: theme.accent.pink,
            color: '#fff',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 48,
          right: 0,
          width: 320,
          maxHeight: 400,
          background: theme.bg.surface,
          border: `1px solid ${theme.border.default}`,
          borderRadius: theme.radius.md,
          overflow: 'auto',
          boxShadow: theme.shadow.modal,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.text.primary }}>排名通知</span>
            {notifications.length > 0 && (
              <button onClick={onClearAll} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer', fontSize: 12 }}>清空</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: theme.text.muted, fontSize: 13 }}>暂无通知</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                <div style={{ fontSize: 13, color: theme.text.primary }}>
                  <span style={{ color: theme.accent.blue, fontWeight: 600 }}>{n.username}</span>
                  {' 以 '}
                  <span style={{ color: theme.accent.green, fontWeight: 700 }}>{n.score}</span>
                  {' 分 '}
                  {n.type === 'rank_up' ? '超越' : '被超越'}
                </div>
                <div style={{ fontSize: 12, color: theme.text.muted, marginTop: 3 }}>
                  排名: #{n.newRank}
                </div>
                <button onClick={() => onDismiss(n.id)} style={{ marginTop: 4, background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer', fontSize: 11 }}>关闭</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
