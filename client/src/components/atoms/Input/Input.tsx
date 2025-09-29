import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const InputContainer = styled.div<{ $fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  width: ${props => props.$fullWidth ? '100%' : '400px'};
`;

const Label = styled.label`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 14px;
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.neutral[700]};
  margin-bottom: 8px;
  letter-spacing: -0.7px;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  height: 60px;
  padding: 0 16px;
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.light};
  color: ${tokens.colors.neutral[900]};
  background-color: ${tokens.colors.neutral[0]};
  border: none;
  border-bottom: 1px solid ${props => props.$hasError ? '#F44336' : '#CCCCCC'};
  transition: all ${tokens.animation.duration.fast} ${tokens.animation.easing.ease};
  letter-spacing: -0.8px;

  &::placeholder {
    color: #AAAAAA;
    font-weight: ${tokens.typography.fontWeight.light};
  }

  &:focus {
    outline: none;
    border-bottom-color: ${props => props.$hasError ? '#F44336' : tokens.colors.primary[500]};
    background-color: ${tokens.colors.neutral[50]};
  }

  &:hover:not(:focus) {
    background-color: ${tokens.colors.neutral[50]};
  }

  &:disabled {
    background-color: ${tokens.colors.neutral[100]};
    color: ${tokens.colors.neutral[500]};
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 12px;
  font-weight: ${tokens.typography.fontWeight.regular};
  color: #F44336;
  margin-top: 4px;
  letter-spacing: -0.6px;
`;

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  type = 'text',
  ...props
}) => {
  return (
    <InputContainer $fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      <InputWrapper>
        <StyledInput
          type={type}
          $hasError={!!error}
          {...props}
        />
      </InputWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  );
};