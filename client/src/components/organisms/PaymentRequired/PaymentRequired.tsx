/**
 * PaymentRequired Component
 * 결제가 필요한 서비스 접근 시 결제 유도 화면
 */
import React from 'react';
import styled from 'styled-components';
import * as PortOne from '@portone/browser-sdk/v2';
import { useAuth } from '../../../contexts/AuthContext';
import { paymentAPI } from '../../../services/api';
import { PricingCard } from '../PricingCard/PricingCard';
import { tokens } from '../../../design-system/tokens';

interface PaymentRequiredProps {
  serviceName: string;
  productType: string;
  oneTimePrice: number;
  oneTimeDescription: string;
  oneTimeFeatures: string[];
}

export const PaymentRequired: React.FC<PaymentRequiredProps> = ({
  serviceName,
  productType,
  oneTimePrice,
  oneTimeDescription,
  oneTimeFeatures
}) => {
  const { user } = useAuth();

  const handlePurchase = async (
    purchaseProductType: string,
    amount: number,
    paymentType: 'oneTime' | 'subscription'
  ) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 1. 결제 생성
      const response: any = await paymentAPI.create({
        paymentType,
        productType: purchaseProductType,
        amount
      });

      if (response.success) {
        const { merchantUid, productName, amount: paymentAmount } = response.data;

        // 2. PortOne V2 결제창 호출
        const portOneResponse = await PortOne.requestPayment({
          storeId: import.meta.env.VITE_PORTONE_STORE_ID,
          channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
          paymentId: merchantUid,
          orderName: productName,
          totalAmount: paymentAmount,
          currency: 'CURRENCY_KRW',
          payMethod: 'CARD',
          customer: {
            email: user.email || undefined,
            phoneNumber: user.phoneNumber || undefined
          }
        });

        // 3. 결제 결과 처리
        if (portOneResponse?.code !== undefined) {
          alert(`결제 실패: ${portOneResponse.message}`);
          return;
        }

        // 4. 결제 성공 - 검증 및 완료 처리
        if (portOneResponse?.paymentId) {
          try {
            const verifyResponse: any = await paymentAPI.verify(
              portOneResponse.paymentId,
              merchantUid
            );

            if (verifyResponse.success) {
              const completeResponse: any = await paymentAPI.complete(
                portOneResponse.paymentId,
                merchantUid
              );

              if (completeResponse.success) {
                alert('결제가 완료되었습니다!');
                window.location.reload();
              } else {
                alert('결제 완료 처리 중 오류가 발생했습니다.');
              }
            } else {
              alert('결제 검증에 실패했습니다.');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            alert('결제 확인 중 오류가 발생했습니다: ' + error.message);
          }
        }
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
      features: ['모든 운세 서비스 무제한', '24시간 이용', '영구 보관'],
      productType: '1day'
    },
    {
      title: '7일 이용권',
      price: 39000,
      description: '7일간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '7일간 이용', '영구 보관', '약 44% 할인'],
      productType: '7days'
    },
    {
      title: '30일 이용권',
      price: 99000,
      description: '한 달간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '30일간 이용', '영구 보관', '약 67% 할인'],
      productType: '30days'
    }
  ];

  return (
    <PageWrapper>
      <Container>
        <Title>{serviceName}을(를) 이용하려면 결제가 필요합니다</Title>
        <Subtitle>원하시는 요금제를 선택해주세요</Subtitle>
        <InfoMessage>보셨던 운세는 언제든지 마이페이지에서 다시 확인하실 수 있어요.</InfoMessage>

        <SectionTitle>이 서비스만 이용</SectionTitle>
        <SingleServiceSection>
          <PricingCard
            title={serviceName}
            price={oneTimePrice}
            description={oneTimeDescription}
            features={oneTimeFeatures}
            productType={productType}
            paymentType="oneTime"
            onPurchase={() => handlePurchase(productType, oneTimePrice, 'oneTime')}
          />
        </SingleServiceSection>

        <SectionTitle>모든 서비스 이용 (추천)</SectionTitle>
        <SubscriptionSection>
          {subscriptionPlans.map((plan) => (
            <PricingCard
              key={plan.productType}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              productType={plan.productType}
              paymentType="subscription"
              onPurchase={() => handlePurchase(plan.productType, plan.price, 'subscription')}
            />
          ))}
        </SubscriptionSection>
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
  padding: ${tokens.spacing[8]} ${tokens.spacing[6]};

  @media (max-width: 600px) {
    width: 100%;
    padding: ${tokens.spacing[6]} ${tokens.spacing[4]};
  }
`;

const Title = styled.h1`
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  text-align: center;
  margin-bottom: ${tokens.spacing[2]};
`;

const Subtitle = styled.p`
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.neutral[600]};
  text-align: center;
  margin-bottom: ${tokens.spacing[3]};
`;

const InfoMessage = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.primary[500]};
  text-align: center;
  margin-bottom: ${tokens.spacing[8]};
  font-weight: ${tokens.typography.fontWeight.medium};
`;

const SectionTitle = styled.h2`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.neutral[800]};
  margin-bottom: ${tokens.spacing[4]};
  margin-top: ${tokens.spacing[6]};
`;

const SingleServiceSection = styled.div`
  margin-bottom: ${tokens.spacing[8]};
`;

const SubscriptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing[4]};
`;
