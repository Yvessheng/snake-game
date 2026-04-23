import { type CSSProperties, type ButtonHTMLAttributes } from 'react';

interface Win98ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'flat';
  style?: CSSProperties;
}

export function Win98Button({ variant = 'default', style, children, ...props }: Win98ButtonProps) {
  const baseStyle: CSSProperties = {
    fontFamily: '"MS Sans Serif", "Microsoft Sans Serif", "Tahoma", "SimSun", sans-serif',
    fontSize: 12,
    padding: '4px 12px',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
  };

  const variants: Record<string, CSSProperties> = {
    default: {
      background: '#C0C0C0',
      border: '2px outset #FFFFFF',
      color: '#000000',
    },
    primary: {
      background: '#C0C0C0',
      border: '2px outset #FFFFFF',
      color: '#000000',
      fontWeight: 700,
    },
    flat: {
      background: 'transparent',
      border: 'none',
      color: '#000000',
      padding: '2px 6px',
    },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
