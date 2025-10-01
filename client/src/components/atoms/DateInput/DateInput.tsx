/**
 * 한국 형식 날짜 입력 컴포넌트
 * yyyy년 m월 d일 형식으로 날짜를 입력받습니다
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';
import { formatKoreanDateFromString, parseKoreanDate, isValidKoreanDate } from '../../../utils/date';

export interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD 형식
  onChange: (value: string) => void; // YYYY-MM-DD 형식 반환
  error?: string;
  fullWidth?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
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

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error,
  fullWidth = true,
  placeholder = '예: 2024년 1월 1일',
  required,
  disabled
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [internalError, setInternalError] = useState<string | undefined>(error);

  // value(YYYY-MM-DD)가 변경되면 표시값(한국 형식)을 업데이트
  useEffect(() => {
    if (value) {
      try {
        setDisplayValue(formatKoreanDateFromString(value));
      } catch {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // error prop이 변경되면 내부 에러 상태 업데이트
  useEffect(() => {
    setInternalError(error);
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    setInternalError(undefined);

    // 입력값이 비어있으면 빈 문자열 전달
    if (!inputValue.trim()) {
      onChange('');
      return;
    }

    // 한국 형식으로 입력되었는지 확인
    if (isValidKoreanDate(inputValue)) {
      try {
        const isoDate = parseKoreanDate(inputValue);
        onChange(isoDate);
        setInternalError(undefined);
      } catch (err) {
        setInternalError('올바른 날짜 형식이 아닙니다');
      }
    }
  };

  const handleBlur = () => {
    // 포커스를 잃을 때 유효성 검사
    if (displayValue && !isValidKoreanDate(displayValue)) {
      setInternalError('올바른 날짜 형식을 입력해주세요 (예: 2024년 1월 1일)');
    }
  };

  return (
    <InputContainer $fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      <InputWrapper>
        <StyledInput
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          $hasError={!!internalError}
        />
      </InputWrapper>
      {internalError && <ErrorMessage>{internalError}</ErrorMessage>}
    </InputContainer>
  );
};
