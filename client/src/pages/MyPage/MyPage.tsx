/**
 * MyPage
 * 마이페이지 - 운세 기록 조회
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { FortuneHistoryCard } from '../../components/molecules/FortuneHistoryCard';
import { FortuneDetailModal } from '../../components/organisms/FortuneDetailModal';
import { getFortuneHistory, FortuneResult } from '../../services/fortuneHistory';
import { tokens } from '../../design-system/tokens';

export const MyPage: React.FC = () => {
  const { user } = useAuth();
  const [fortunes, setFortunes] = useState<FortuneResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFortune, setSelectedFortune] = useState<FortuneResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadFortuneHistory = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const history = await getFortuneHistory(user.uid);
        setFortunes(history);
      } catch (err: any) {
        console.error('Error loading fortune history:', err);
        setError('운세 기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadFortuneHistory();
  }, [user]);

  const handleCardClick = (fortune: FortuneResult) => {
    setSelectedFortune(fortune);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFortune(null);
  };

  return (
    <PageWrapper>
      <Container>
        <Content>
          <Title>마이페이지</Title>
          <Subtitle>보셨던 운세를 다시 확인할 수 있어요</Subtitle>

          {loading && <LoadingMessage>운세 기록을 불러오는 중...</LoadingMessage>}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {!loading && !error && fortunes.length === 0 && (
            <EmptyMessage>
              <EmptyIcon>🔮</EmptyIcon>
              <EmptyText>아직 본 운세가 없어요</EmptyText>
              <EmptySubText>운세 서비스를 이용해보세요!</EmptySubText>
            </EmptyMessage>
          )}

          {!loading && !error && fortunes.length > 0 && (
            <FortuneList>
              {fortunes.map((fortune) => (
                <FortuneHistoryCard
                  key={fortune.resultId}
                  fortune={fortune}
                  onClick={() => handleCardClick(fortune)}
                />
              ))}
            </FortuneList>
          )}
        </Content>

        {selectedFortune && (
          <FortuneDetailModal
            fortune={selectedFortune}
            isOpen={modalOpen}
            onClose={handleCloseModal}
          />
        )}
      </Container>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${tokens.colors.neutral[50]};
  display: flex;
  justify-content: center;
  padding: 0 420px;

  @media (max-width: 1440px) {
    padding: 0;
  }
`;

const Container = styled.div`
  width: 600px;
  min-height: 100vh;
  background: ${tokens.colors.neutral[0]};
  position: relative;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Content = styled.div`
  padding: ${tokens.spacing[8]} ${tokens.spacing[6]};
`;

const Title = styled.h1`
  font-size: ${tokens.typography.fontSize['3xl']};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  text-align: center;
  margin-bottom: ${tokens.spacing[2]};
`;

const Subtitle = styled.p`
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.neutral[600]};
  text-align: center;
  margin-bottom: ${tokens.spacing[8]};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${tokens.spacing[12]} ${tokens.spacing[4]};
  font-size: ${tokens.typography.fontSize.lg};
  color: ${tokens.colors.neutral[500]};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${tokens.spacing[6]};
  background: ${tokens.colors.semantic.error}15;
  color: ${tokens.colors.semantic.error};
  border-radius: ${tokens.borderRadius.md};
  margin-bottom: ${tokens.spacing[6]};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: ${tokens.spacing[12]} ${tokens.spacing[4]};
`;

const EmptyIcon = styled.div`
  font-size: ${tokens.typography.fontSize['6xl']};
  margin-bottom: ${tokens.spacing[4]};
`;

const EmptyText = styled.p`
  font-size: ${tokens.typography.fontSize.xl};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.neutral[700]};
  margin-bottom: ${tokens.spacing[2]};
`;

const EmptySubText = styled.p`
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.neutral[500]};
  margin: 0;
`;

const FortuneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing[4]};
`;
