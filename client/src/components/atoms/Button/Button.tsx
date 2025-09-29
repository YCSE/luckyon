import React from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../../design-system/tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'fortune' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const sizeStyles = {
  small: css`
    padding: 8px 16px;
    font-size: 14px;
    height: 40px;
  `,
  medium: css`
    padding: 12px 24px;
    font-size: 16px;
    height: 48px;
  `,
  large: css`
    padding: 16px 32px;
    font-size: 18px;
    height: 60px;
  `
};

const variantStyles = {
  primary: css`
    background-color: ${tokens.colors.primary[500]};
    color: ${tokens.colors.neutral[0]};
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.primary[600]};
    }

    &:active:not(:disabled) {
      background-color: ${tokens.colors.primary[700]};
    }
  `,
  secondary: css`
    background-color: ${tokens.colors.neutral[0]};
    color: ${tokens.colors.primary[500]};
    border: 2px solid ${tokens.colors.primary[500]};

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.primary[50]};
    }

    &:active:not(:disabled) {
      background-color: ${tokens.colors.primary[100]};
    }
  `,
  fortune: css`
    background: linear-gradient(135deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.primary[300]} 100%);
    color: ${tokens.colors.neutral[0]};
    border: none;
    box-shadow: ${tokens.shadows.glow};
    animation: glow 2s ease-in-out infinite;

    &:hover:not(:disabled) {
      box-shadow: 0 0 30px rgba(248, 135, 7, 0.5);
    }

    @keyframes glow {
      0%, 100% { box-shadow: ${tokens.shadows.glow}; }
      50% { box-shadow: 0 0 30px rgba(248, 135, 7, 0.5); }
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${tokens.colors.neutral[600]};
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.neutral[100]};
    }

    &:active:not(:disabled) {
      background-color: ${tokens.colors.neutral[200]};
    }
  `
};

const StyledButton = styled.button<ButtonProps>`
  font-family: ${tokens.typography.fontFamily.primary};
  font-weight: ${tokens.typography.fontWeight.bold};
  border-radius: 100px;
  cursor: pointer;
  transition: all ${tokens.animation.duration.fast} ${tokens.animation.easing.easeOut};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  letter-spacing: -0.9px;

  ${props => sizeStyles[props.size || 'medium']}
  ${props => variantStyles[props.variant || 'primary']}

  ${props => props.fullWidth && css`
    width: 100%;
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid ${tokens.colors.primary[500]};
    outline-offset: 2px;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};