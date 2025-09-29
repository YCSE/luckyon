import { tokens } from '../design-system/tokens';

export const theme = {
  ...tokens,
  // Add computed values
  computed: {
    headerHeight: '64px',
    sidebarWidth: '260px',
    maxContentWidth: '1200px',
    fortuneCardAspectRatio: '3/4',
  }
};

// Type definition for styled-components
export type Theme = typeof theme;