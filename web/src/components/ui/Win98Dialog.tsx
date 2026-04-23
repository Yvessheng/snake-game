import { type CSSProperties, type ReactNode } from 'react';
import { theme } from '../../types/theme';

interface Win98DialogProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function Win98Dialog({ title, children, onClose, style, className }: Win98DialogProps) {
  return (
    <div
      className={className}
      style={{
        background: theme.bg.surface,
        border: theme.bevel.raised,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          background: theme.titleBar.active,
          color: theme.text.inverse,
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 700,
          userSelect: 'none',
        }}
      >
        <span style={{ padding: '0 2px' }}>{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: 16,
              height: 14,
              fontSize: 9,
              lineHeight: '12px',
              padding: 0,
              background: '#C0C0C0',
              border: '2px outset #FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ padding: 8 }}>{children}</div>
    </div>
  );
}
