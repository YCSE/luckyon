/**
 * 연애운 페이지
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

const Select = styled.select`
  padding: 12px;
  font-size: 14px;
  border: 1px solid ${tokens.colors.neutral[300]};
  border-radius: 8px;
  background: ${tokens.colors.neutral[0]};
  color: ${tokens.colors.neutral[800]};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${tokens.colors.primary[500]};
  }
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
`;

const ErrorMessage = styled.div`
  padding: 15px;
  background: #fee;
  color: #c00;
  border-radius: 8px;
  margin-top: 15px;
`;

export const LovePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [relationshipStatus, setRelationshipStatus] = useState<'single' | 'dating' | 'married' | 'divorced'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response: any = await fortuneAPI.love({ name, birthDate, gender, relationshipStatus });
      if (response.success) {
        setResult(response.data);
      }
    } catch (err: any) {
      setError(err.message || '연애운 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Container><Title>로그인이 필요합니다</Title></Container>;
  }

  return (
    <Container>
      <Title>💖 연애운</Title>

      <Form onSubmit={handleSubmit}>
        <div>
          <Label>이름</Label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>생년월일</Label>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        </div>
        <div>
          <Label>성별</Label>
          <Select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </Select>
        </div>
        <div>
          <Label>연애 상태</Label>
          <Select
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value as any)}
          >
            <option value="single">싱글</option>
            <option value="dating">연애 중</option>
            <option value="married">결혼</option>
            <option value="divorced">이혼</option>
          </Select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? '분석 중...' : '연애운 보기'}
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