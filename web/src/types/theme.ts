// Design Tokens - Unified Theme
// Based on UI/UX Pro Max: layered dark mode with subtle depth

export const theme = {
  // Background layers (darkest to lightest)
  bg: {
    page: '#0A0A0F',       // Page background - deepest
    surface: '#12121A',     // Card/surface background
    elevated: '#1A1A24',    // Hover/elevated state
  },
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.35)',
  },
  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.16)',
  },
  // Accent colors (use sparingly)
  accent: {
    green: '#00D97E',       // Scores, success
    blue: '#3B82F6',        // Primary actions
    pink: '#F43F5E',        // Danger, game over
    yellow: '#FBBF24',      // Food, warnings
    purple: '#A78BFA',      // Achievements
  },
  // Canvas
  canvas: {
    bg: '#0F0F17',          // Game canvas background
    grid: 'rgba(255, 255, 255, 0.03)',
  },
  // Shadows
  shadow: {
    card: '0 1px 3px rgba(0, 0, 0, 0.4)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.6)',
  },
  // Border radius
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
  },
};
