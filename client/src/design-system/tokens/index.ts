/**
 * Design System Tokens for LuckyOn
 * Central source of truth for all design values
 */

export const tokens = {
  colors: {
    // Brand Colors (Fortune/Lucky Theme)
    primary: {
      50: '#fef3e2',  // Light Gold
      100: '#fde1b5',
      200: '#fcc883',
      300: '#fbaf51',
      400: '#f99b2c',
      500: '#E56030',  // Main Brand Orange (from Figma identity)
      600: '#f67f06',
      700: '#f37405',
      800: '#f16a04',
      900: '#ed5703',  // Deep Gold
    },
    secondary: {
      50: '#f0e6ff',  // Light Purple (Mystical)
      100: '#d9c0ff',
      200: '#c096ff',
      300: '#a66cff',
      400: '#934dff',
      500: '#802eff',  // Main Purple
      600: '#7829ff',
      700: '#6d22ff',
      800: '#631cff',
      900: '#5010ff',  // Deep Purple
    },
    zodiac: {
      // 12 Zodiac Signs Colors
      rat: '#E74C3C',
      ox: '#8B4513',
      tiger: '#FF6F00',
      rabbit: '#FFB6C1',
      dragon: '#4B0082',
      snake: '#228B22',
      horse: '#8B0000',
      goat: '#87CEEB',
      monkey: '#FFD700',
      rooster: '#DC143C',
      dog: '#8B4513',
      pig: '#FF69B4'
    },
    fortune: {
      excellent: '#4CAF50',  // Green
      good: '#8BC34A',
      normal: '#FFC107',      // Yellow
      caution: '#FF9800',     // Orange
      bad: '#F44336'          // Red
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F8F8F8',   // bg1 from Figma
      100: '#F1F3F5',
      200: '#E9ECEF',
      300: '#DDDDDD',  // line2 from Figma
      400: '#BBBBBB',  // text4 from Figma
      500: '#AAAAAA',  // text3 from Figma
      600: '#777777',  // text2 from Figma
      700: '#495057',
      800: '#333333',  // text_기본 from Figma
      900: '#212529',
      1000: '#000000'
    },
    semantic: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    }
  },

  typography: {
    fontFamily: {
      primary: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      secondary: "'Nanum Myeongjo', serif", // For fortune content
      mono: "'Noto Sans Mono', 'Courier New', monospace"
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '4.0625rem', // 65px (H1 from Figma)
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2
    }
  },

  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    full: '9999px'
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(229, 96, 48, 0.3)', // Orange glow for special effects
  },

  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
      slower: '700ms'
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Export Figma-specific tokens
export { figmaTokens, figmaNodeIds, getFigmaStyle } from './figma-mapped';