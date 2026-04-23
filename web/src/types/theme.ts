// Design Tokens - Windows 98 Classic
// Based on Windows 98 system colors

export const theme = {
  // Background colors
  bg: {
    page: '#008080',       // Win98 teal desktop
    surface: '#C0C0C0',    // Win98 dialog gray
    elevated: '#FFFFFF',   // Input fields, list items
  },
  // Text colors
  text: {
    primary: '#000000',
    secondary: '#404040',
    muted: '#808080',
    inverse: '#FFFFFF',    // Text on title bars
  },
  // Win98 Title bar
  titleBar: {
    active: '#000080',     // Navy blue
    inactive: '#808080',   // Gray
  },
  // Borders (non-bevel)
  border: {
    subtle: '#808080',
    default: '#404040',
    active: '#000080',
  },
  // Accent colors (Win98 16-color palette)
  accent: {
    green: '#008000',
    blue: '#000080',
    pink: '#800000',
    yellow: '#808000',
    purple: '#800080',
  },
  // Canvas-specific
  canvas: {
    bg: '#808080',
    grid: '#A0A0A0',
  },
  // Zone colors (match game.ts ZONES)
  zones: {
    center: { bg: '#8899AA', border: '#AABBCC' },
    forest: { bg: '#779977', border: '#88AA88' },
    desert: { bg: '#AA9966', border: '#BBAA77' },
    lava: { bg: '#994444', border: '#AA5555' },
  },
  // Food colors (match game.ts FOOD_TYPES)
  food: {
    apple: '#CC3333',
    berry: '#6633CC',
    nut: '#886633',
    mushroom: '#CC6699',
    cactus: '#33AA33',
    chili: '#CC6600',
  },
  // Win98 bevel border strings
  bevel: {
    raised: '2px outset #FFFFFF',
    raisedPressed: '2px inset #FFFFFF',
    sunken: '2px inset #FFFFFF',
  },
  // No shadows in Win98
  shadow: {
    card: 'none',
    modal: 'none',
  },
  // All corners sharp
  radius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
  },
};
