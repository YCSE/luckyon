/**
 * 토정비결 페이지
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { fortuneAPI } from '../../services/api';
import { tokens } from '../../design-system/tokens';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { BirthDateInput } from '../../components/atoms/BirthDateInput';
import { PaymentRequired } from '../../components/organisms/PaymentRequired';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  margin-bottom: 30px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: ${tokens.colors.neutral[0]};
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.neutral[700]};
  margin-bottom: 8px;
`;

const ResultContainer = styled.div`
  margin-top: 40px;
  padding: 30px;
  background: ${tokens.colors.neutral[50]};
  border-radius: 12px;
`;

const ResultHTML = styled.div`
  line-height: 1.8;
  color: ${tokens.colors.neutral[800]};

  h1, h2, h3 {
    margin-top: 24px;
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 12px;
  }
`;

const ErrorMessage = styled.div`
  color: ${tokens.colors.semantic.error};
  font-size: 14px;
  margin-top: 10px;
`;

export const TojungPage: React.FC = () => {
  const { user, checkServiceAccess } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [lunarCalendar, setLunarCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await fortuneAPI.tojung({ name, birthDate, lunarCalendar });

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || '토정비결 조회에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '토정비결 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Title>☀️ 토정비결</Title>
        <p>로그인이 필요한 서비스입니다.</p>
      </Container>
    );
  }

  // 결제 확인
  if (!checkServiceAccess('tojung')) {
    return (
      <PaymentRequired
        serviceName="토정비결"
        productType="tojung"
        oneTimePrice={7900}
        oneTimeDescription="한 해의 운세를 봅니다"
        oneTimeFeatures={['365일 캐시', '연간 운세', '월별 운세']}
      />
    );
  }

  return (
    <Container>
      <Title>☀️ 토정비결</Title>

      <Form onSubmit={handleSubmit}>
        <div>
          <Label>이름</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            required
          />
        </div>

        <div>
          <BirthDateInput
            label="생년월일"
            value={birthDate}
            onChange={setBirthDate}
            
            required
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={lunarCalendar}
              onChange={(e) => setLunarCalendar(e.target.checked)}
            />
            {' 음력으로 조회'}
          </label>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? '토정비결 확인 중...' : '토정비결 확인하기'}
        </Button>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>

      {result && (
        <ResultContainer>
          <ResultHTML dangerouslySetInnerHTML={{ __html: result.html }} />
        </ResultContainer>
      )}
    </Container>
  );
};