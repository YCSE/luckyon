/**
 * 오늘의 운세 페이지
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { fortuneAPI } from '../../services/api';
import { tokens } from '../../design-system/tokens';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';

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
  color: ${tokens.colors.neutral[800]};
  line-height: 1.8;

  h2 {
    font-size: 24px;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  section {
    margin-bottom: 20px;
  }
`;

const ErrorMessage = styled.div`
  padding: 15px;
  background: #fee;
  color: #c00;
  border-radius: 8px;
  margin-top: 15px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: ${tokens.colors.neutral[600]};
`;

export const TodayFortunePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response: any = await fortuneAPI.today({ name, birthDate });

      if (response.success) {
        setResult(response.data);
      } else {
        setError('운세 생성에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Fortune generation error:', err);
      setError(err.message || '운세 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Title>로그인이 필요합니다</Title>
        <p style={{ textAlign: 'center' }}>
          오늘의 운세를 확인하려면 먼저 로그인해주세요.
        </p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🌟 오늘의 운세</Title>

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
          <Label>생년월일</Label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? '운세 확인 중...' : '운세 확인하기'}
        </Button>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>

      {loading && <LoadingMessage>AI가 운세를 분석하고 있습니다...</LoadingMessage>}

      {result && (
        <ResultContainer>
          <ResultHTML dangerouslySetInnerHTML={{ __html: result.html }} />
          {result.summary && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px' }}>
              <strong>요약:</strong> {result.summary}
            </div>
          )}
        </ResultContainer>
      )}
    </Container>
  );
};