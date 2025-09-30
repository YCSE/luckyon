/**
 * 궁합 페이지
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
`;

const ErrorMessage = styled.div`
  padding: 15px;
  background: #fee;
  color: #c00;
  border-radius: 8px;
  margin-top: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.neutral[700]};
  margin: 20px 0 10px 0;
`;

export const CompatibilityPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response: any = await fortuneAPI.compatibility({ name, birthDate, partnerName, partnerBirthDate });
      if (response.success) {
        setResult(response.data);
      }
    } catch (err: any) {
      setError(err.message || '궁합 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Container><Title>로그인이 필요합니다</Title></Container>;
  }

  return (
    <Container>
      <Title>💑 궁합</Title>

      <Form onSubmit={handleSubmit}>
        <SectionTitle>본인 정보</SectionTitle>
        <div>
          <Label>이름</Label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>생년월일</Label>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        </div>

        <SectionTitle>상대방 정보</SectionTitle>
        <div>
          <Label>이름</Label>
          <Input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required />
        </div>
        <div>
          <Label>생년월일</Label>
          <Input type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} required />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? '분석 중...' : '궁합 보기'}
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