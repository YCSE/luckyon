/**
 * 가격 및 결제 페이지
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { paymentAPI } from '../../services/api';
import { PricingCard } from '../../components/organisms/PricingCard/PricingCard';
import { tokens } from '../../design-system/tokens';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  text-align: center;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: ${tokens.colors.neutral[600]};
  text-align: center;
  margin-bottom: 60px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.semibold};
  cursor: pointer;
  background: ${({ $active }) =>
    $active ? tokens.colors.primary[500] : tokens.colors.neutral[100]};
  color: ${({ $active }) => ($active ? tokens.colors.neutral[0] : tokens.colors.neutral[700])};
  transition: all 0.2s;

  &:hover {
    background: ${({ $active }) =>
      $active ? tokens.colors.primary[600] : tokens.colors.neutral[200]};
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
`;

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'subscription' | 'oneTime'>('subscription');

  const handlePurchase = async (productType: string, amount: number, paymentType: 'oneTime' | 'subscription') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 1. 결제 생성
      const response: any = await paymentAPI.create({
        paymentType,
        productType,
        amount
      });

      if (response.success) {
        const { merchantUid, paymentId } = response.data;

        // 2. PortOne 결제 모듈 호출 (실제 구현 시 PortOne SDK 사용)
        alert(`결제 준비 완료\nMerchant UID: ${merchantUid}\nPayment ID: ${paymentId}\n\n실제 서비스에서는 PortOne 결제 창이 열립니다.`);

        // 3. 결제 완료 후 verifyPayment, completePayment 호출
        // (PortOne SDK 콜백에서 처리)
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('결제 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const subscriptionPlans = [
    {
      title: '1일 이용권',
      price: 9900,
      description: '24시간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '24시간 이용', '캐시 기능'],
      productType: '1day'
    },
    {
      title: '7일 이용권',
      price: 39000,
      description: '7일간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '7일간 이용', '캐시 기능', '약 44% 할인'],
      productType: '7days',
      recommended: true
    },
    {
      title: '30일 이용권',
      price: 99000,
      description: '한 달간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '30일간 이용', '캐시 기능', '약 67% 할인'],
      productType: '30days'
    }
  ];

  const oneTimePlans = [
    {
      title: '오늘의 운세',
      price: 3900,
      description: '당일 운세를 확인하세요',
      features: ['6시간 캐시', '종합운/사랑운/재물운/건강운'],
      productType: 'today'
    },
    {
      title: '사주팔자',
      price: 9900,
      description: '평생 사주를 분석합니다',
      features: ['30일 캐시', '생시 기반 정밀 분석', '사주 해석'],
      productType: 'saju'
    },
    {
      title: '토정비결',
      price: 7900,
      description: '한 해의 운세를 봅니다',
      features: ['365일 캐시', '연간 운세', '월별 운세'],
      productType: 'tojung'
    },
    {
      title: '궁합',
      price: 12900,
      description: '두 사람의 궁합을 봅니다',
      features: ['7일 캐시', '사랑 궁합', '결혼 궁합'],
      productType: 'compatibility'
    },
    {
      title: '재물운',
      price: 5900,
      description: '금전 운세를 봅니다',
      features: ['24시간 캐시', '직업별 맞춤 분석', '투자운'],
      productType: 'wealth'
    },
    {
      title: '연애운',
      price: 6900,
      description: '연애 운세를 봅니다',
      features: ['24시간 캐시', '상태별 맞춤 분석', '이상형 분석'],
      productType: 'love'
    }
  ];

  return (
    <Container>
      <Title>요금제 선택</Title>
      <Subtitle>AI가 분석하는 정확한 운세 서비스</Subtitle>

      <TabContainer>
        <Tab $active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')}>
          정기 이용권
        </Tab>
        <Tab $active={activeTab === 'oneTime'} onClick={() => setActiveTab('oneTime')}>
          개별 구매
        </Tab>
      </TabContainer>

      {activeTab === 'subscription' ? (
        <CardGrid>
          {subscriptionPlans.map((plan) => (
            <PricingCard
              key={plan.productType}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              productType={plan.productType}
              paymentType="subscription"
              recommended={plan.recommended}
              onPurchase={() => handlePurchase(plan.productType, plan.price, 'subscription')}
            />
          ))}
        </CardGrid>
      ) : (
        <ServiceGrid>
          {oneTimePlans.map((plan) => (
            <PricingCard
              key={plan.productType}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              productType={plan.productType}
              paymentType="oneTime"
              onPurchase={() => handlePurchase(plan.productType, plan.price, 'oneTime')}
            />
          ))}
        </ServiceGrid>
      )}
    </Container>
  );
};