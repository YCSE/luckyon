/**
 * FortuneHistoryCard Component
 * 운세 기록 카드
 */
import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';
import { formatKoreanDate } from '../../../utils/date';
import { FortuneResult, getFortuneTypeName, getFortuneTypeEmoji } from '../../../services/fortuneHistory';

interface FortuneHistoryCardProps {
  fortune: FortuneResult;
  onClick: () => void;
}

export const FortuneHistoryCard: React.FC<FortuneHistoryCardProps> = ({ fortune, onClick }) => {
  return (
    <Card onClick={onClick}>
      <Header>
        <EmojiIcon>{getFortuneTypeEmoji(fortune.serviceType)}</EmojiIcon>
        <TitleSection>
          <Title>{getFortuneTypeName(fortune.serviceType)}</Title>
          <Date>{formatKoreanDate(fortune.createdAt)}</Date>
        </TitleSection>
      </Header>
      <InfoText>{fortune.requestData.name}님의 운세</InfoText>
    </Card>
  );
};

const Card = styled.div`
  background: ${tokens.colors.neutral[0]};
  border-radius: ${tokens.borderRadius.lg};
  padding: ${tokens.spacing[5]};
  cursor: pointer;
  transition: all ${tokens.animation.duration.base} ${tokens.animation.easing.easeOut};
  border: 1px solid ${tokens.colors.neutral[200]};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${tokens.shadows.md};
    border-color: ${tokens.colors.primary[500]};
  }

  &:active {
    transform: translateY(0);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing[3]};
  margin-bottom: ${tokens.spacing[2]};
`;

const EmojiIcon = styled.div`
  font-size: ${tokens.typography.fontSize['3xl']};
  line-height: 1;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  margin: 0 0 ${tokens.spacing[1]} 0;
`;

const Date = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.neutral[500]};
  margin: 0;
`;

const InfoText = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.neutral[600]};
  margin: 0;
`;
