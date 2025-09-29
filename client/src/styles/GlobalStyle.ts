import { createGlobalStyle } from 'styled-components';
import { tokens } from '../design-system/tokens';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${tokens.typography.fontFamily.primary};
    font-size: ${tokens.typography.fontSize.base};
    line-height: ${tokens.typography.lineHeight.normal};
    color: ${tokens.colors.neutral[900]};
    background-color: ${tokens.colors.neutral[0]};
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Korean text optimization */
  .korean-content {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.8;
    word-break: keep-all;
    letter-spacing: -0.02em;
  }

  /* Fortune classical text style */
  .fortune-classical {
    font-family: 'Nanum Myeongjo', serif;
    line-height: 1.8;
  }

  /* Fortune glow animation */
  .fortune-glow {
    animation: glow 2s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(248, 135, 7, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(248, 135, 7, 0.5);
    }
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${tokens.colors.neutral[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${tokens.colors.neutral[400]};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${tokens.colors.neutral[500]};
  }

  /* Selection styling */
  ::selection {
    background-color: ${tokens.colors.primary[100]};
    color: ${tokens.colors.primary[900]};
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid ${tokens.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Button reset */
  button {
    font-family: inherit;
  }

  /* Link styles */
  a {
    color: ${tokens.colors.primary[500]};
    text-decoration: none;
    transition: opacity ${tokens.animation.duration.fast} ${tokens.animation.easing.ease};

    &:hover {
      opacity: 0.8;
    }
  }

  /* Form elements */
  input, textarea, select {
    font-family: inherit;
  }

  /* Disabled state */
  [disabled] {
    opacity: 0.5;
    cursor: not-allowed !important;
  }

  /* Loading state */
  .loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* Utility classes */
  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;