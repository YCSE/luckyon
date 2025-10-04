/**
 * 생년월일 입력 컴포넌트
 * 년/월/일을 드롭다운으로 선택하여 UX를 개선합니다
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

export interface BirthDateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD 형식
  onChange: (value: string) => void; // YYYY-MM-DD 형식 반환
  error?: string;
  fullWidth?: boolean;
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
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Select = styled.select<{ $hasError?: boolean; width?: string }>`
  width: ${props => props.width || '110px'};
  height: 60px;
  padding: 0 12px;
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.regular};
  color: ${tokens.colors.neutral[900]};
  background-color: ${tokens.colors.neutral[0]};
  border: none;
  border-bottom: 2px solid ${props => props.$hasError ? '#F44336' : '#CCCCCC'};
  transition: all ${tokens.animation.duration.fast} ${tokens.animation.easing.ease};
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 20px;
  padding-right: 35px;

  &:focus {
    outline: none;
    border-bottom-color: ${props => props.$hasError ? '#F44336' : tokens.colors.primary[500]};
    background-color: ${tokens.colors.neutral[50]};
  }

  &:hover:not(:disabled) {
    background-color: ${tokens.colors.neutral[50]};
  }

  &:disabled {
    background-color: ${tokens.colors.neutral[100]};
    color: ${tokens.colors.neutral[500]};
    cursor: not-allowed;
  }

  option {
    background-color: ${tokens.colors.neutral[0]};
    color: ${tokens.colors.neutral[900]};
  }
`;

const Separator = styled.span`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 18px;
  font-weight: ${tokens.typography.fontWeight.regular};
  color: ${tokens.colors.neutral[600]};
  margin: 0 4px;
`;

const ErrorMessage = styled.span`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 12px;
  font-weight: ${tokens.typography.fontWeight.regular};
  color: #F44336;
  margin-top: 4px;
  letter-spacing: -0.6px;
`;

export const BirthDateInput: React.FC<BirthDateInputProps> = ({
  label,
  value,
  onChange,
  error,
  fullWidth = true,
  required,
  disabled
}) => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [internalError, setInternalError] = useState<string | undefined>(error);

  // 연도 옵션 생성 (1900 ~ 현재 연도)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  // 월 옵션 생성 (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 일 옵션 생성 (선택된 년/월에 따라 달라짐)
  const getDaysInMonth = (y: string, m: string): number => {
    if (!y || !m) return 31;
    const yearNum = parseInt(y, 10);
    const monthNum = parseInt(m, 10);
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // value(YYYY-MM-DD)를 년/월/일로 분리
  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m ? String(parseInt(m, 10)) : '');
      setDay(d ? String(parseInt(d, 10)) : '');
    } else if (!value) {
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  // error prop이 변경되면 내부 에러 상태 업데이트
  useEffect(() => {
    setInternalError(error);
  }, [error]);

  // 년/월/일이 모두 입력되면 YYYY-MM-DD 형식으로 변환하여 onChange 호출
  const updateValue = (newYear: string, newMonth: string, newDay: string) => {
    if (newYear && newMonth && newDay) {
      // 유효성 검사
      const y = parseInt(newYear, 10);
      const m = parseInt(newMonth, 10);
      const d = parseInt(newDay, 10);

      if (y < 1900 || y > new Date().getFullYear()) {
        setInternalError('올바른 연도를 입력해주세요');
        return;
      }

      if (m < 1 || m > 12) {
        setInternalError('월은 1-12 사이여야 합니다');
        return;
      }

      if (d < 1 || d > 31) {
        setInternalError('일은 1-31 사이여야 합니다');
        return;
      }

      // 날짜 유효성 검사
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
        setInternalError('존재하지 않는 날짜입니다');
        return;
      }

      setInternalError(undefined);
      const formattedMonth = String(m).padStart(2, '0');
      const formattedDay = String(d).padStart(2, '0');
      onChange(`${newYear}-${formattedMonth}-${formattedDay}`);
    } else {
      // 모두 입력되지 않았으면 빈 문자열
      if (!newYear && !newMonth && !newDay) {
        onChange('');
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setYear(newYear);
    updateValue(newYear, month, day);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    // 월이 변경되면 일자가 유효한지 확인하고 조정
    const newDaysInMonth = getDaysInMonth(year, newMonth);
    const currentDay = parseInt(day, 10);
    if (currentDay > newDaysInMonth) {
      setDay('');
      updateValue(year, newMonth, '');
    } else {
      updateValue(year, newMonth, day);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = e.target.value;
    setDay(newDay);
    updateValue(year, month, newDay);
  };

  return (
    <InputContainer $fullWidth={fullWidth}>
      {label && <Label>{label}{required && ' *'}</Label>}
      <InputWrapper>
        <Select
          value={year}
          onChange={handleYearChange}
          required={required}
          disabled={disabled}
          $hasError={!!internalError}
          width="120px"
        >
          <option value="">년도</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <Separator>년</Separator>
        <Select
          value={month}
          onChange={handleMonthChange}
          required={required}
          disabled={disabled}
          $hasError={!!internalError}
          width="90px"
        >
          <option value="">월</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Separator>월</Separator>
        <Select
          value={day}
          onChange={handleDayChange}
          required={required}
          disabled={disabled}
          $hasError={!!internalError}
          width="90px"
        >
          <option value="">일</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Separator>일</Separator>
      </InputWrapper>
      {internalError && <ErrorMessage>{internalError}</ErrorMessage>}
    </InputContainer>
  );
};
