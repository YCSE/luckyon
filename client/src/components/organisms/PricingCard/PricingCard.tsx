/**
 * 가격표 카드 컴포넌트
 */
import React from 'react';
import styled from 'styled-components';
import { Button } from '../../atoms/Button';
import { tokens } from '../../../design-system/tokens';

interface PricingCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  productType: string;
  paymentType: 'oneTime' | 'subscription';
  recommended?: boolean;
  onPurchase: () => void;
}

const Card = styled.div<{ $recommended?: boolean }>`
  background: ${tokens.colors.neutral[0]};
  border-radius: 16px;
  padding: 30px;
  box-shadow: ${({ $recommended }) =>
    $recommended ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  position: relative;
  border: ${({ $recommended }) =>
    $recommended ? `2px solid ${tokens.colors.primary[500]}` : '1px solid ' + tokens.colors.neutral[200]};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: ${tokens.colors.primary[500]};
  color: ${tokens.colors.neutral[0]};
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: ${tokens.typography.fontWeight.semibold};
`;

const Title = styled.h3`
  font-size: 24px;
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: ${tokens.colors.neutral[600]};
  margin-bottom: 20px;
`;

const Price = styled.div`
  font-size: 36px;
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.primary[500]};
  margin-bottom: 24px;

  span {
    font-size: 16px;
    color: ${tokens.colors.neutral[600]};
    font-weight: ${tokens.typography.fontWeight.regular};
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
`;

const FeatureItem = styled.li`
  padding: 8px 0;
  font-size: 14px;
  color: ${tokens.colors.neutral[700]};
  display: flex;
  align-items: center;

  &:before {
    content: '✓';
    color: ${tokens.colors.primary[500]};
    font-weight: bold;
    margin-right: 12px;
  }
`;

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  recommended,
  onPurchase
}) => {
  return (
    <Card $recommended={recommended}>
      {recommended && <RecommendedBadge>추천</RecommendedBadge>}

      <Title>{title}</Title>
      <Description>{description}</Description>

      <Price>
        ₩{price.toLocaleString()}
        <span>원</span>
      </Price>

      <FeatureList>
        {features.map((feature, index) => (
          <FeatureItem key={index}>{feature}</FeatureItem>
        ))}
      </FeatureList>

      <Button onClick={onPurchase} fullWidth>
        구매하기
      </Button>
    </Card>
  );
};