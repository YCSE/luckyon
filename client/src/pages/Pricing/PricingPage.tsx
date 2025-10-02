/**
 * 가격 및 결제 페이지
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import * as PortOne from '@portone/browser-sdk/v2';
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
  margin-bottom: 16px;
`;

const InfoMessage = styled.p`
  font-size: 14px;
  color: ${tokens.colors.primary[500]};
  text-align: center;
  margin-bottom: 40px;
  font-weight: ${tokens.typography.fontWeight.medium};
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
      // 1. 결제 생성 (Firebase Functions에서 merchantUid 생성)
      const response: any = await paymentAPI.create({
        paymentType,
        productType,
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
        // 사용자가 결제를 취소한 경우
        if (portOneResponse === undefined) {
          alert('결제가 취소되었습니다.');
          return;
        }

        // 결제 실패 (code가 있으면 오류)
        if (portOneResponse.code !== undefined) {
          console.error('결제 실패:', portOneResponse);
          alert(`결제 실패: ${portOneResponse.message || '알 수 없는 오류'}`);
          return;
        }

        // 4. 결제 성공 - 검증 및 완료 처리
        // PaymentResponse 타입에 따르면 paymentId는 항상 존재
        try {
          // 4-1. 결제 검증
          const verifyResponse: any = await paymentAPI.verify(
            portOneResponse.paymentId,
            merchantUid
          );

          if (verifyResponse.success) {
            // 4-2. 결제 완료 처리
            const completeResponse: any = await paymentAPI.complete(
              portOneResponse.paymentId,
              merchantUid
            );

            if (completeResponse.success) {

              // 결제 타입에 따라 적절한 페이지로 이동
              if (paymentType === 'subscription') {
                // 구독: 모든 서비스 이용 가능하므로 홈으로
                alert('결제가 완료되었습니다! 홈으로 이동합니다.');
                setTimeout(() => {
                  window.location.href = '/';
                }, 100);
              } else {
                // 일회성: 해당 서비스 페이지로 이동
                const serviceRoutes: Record<string, string> = {
                  today: '/fortune/today',
                  saju: '/fortune/saju',
                  tojung: '/fortune/tojung',
                  compatibility: '/fortune/compatibility',
                  wealth: '/fortune/wealth',
                  love: '/fortune/love'
                };
                const targetRoute = serviceRoutes[productType] || '/';
                alert(`결제가 완료되었습니다! ${targetRoute}로 이동합니다.`);
                setTimeout(() => {
                  window.location.href = targetRoute;
                }, 100);
              }
            } else {
              console.error('결제 완료 처리 실패:', completeResponse);
              alert('결제 완료 처리 중 오류가 발생했습니다.');
            }
          } else {
            console.error('결제 검증 실패:', verifyResponse);
            alert('결제 검증에 실패했습니다.');
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          alert('결제 확인 중 오류가 발생했습니다: ' + error.message);
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
      productType: '7days',
      recommended: true
    },
    {
      title: '30일 이용권',
      price: 99000,
      description: '한 달간 모든 서비스 무제한 이용',
      features: ['모든 운세 서비스 무제한', '30일간 이용', '영구 보관', '약 67% 할인'],
      productType: '30days'
    }
  ];

  const oneTimePlans = [
    {
      title: '오늘의 운세',
      price: 3900,
      description: '당일 운세를 확인하세요',
      features: ['종합운/사랑운/재물운/건강운'],
      productType: 'today'
    },
    {
      title: '사주팔자',
      price: 9900,
      description: '평생 사주를 분석합니다',
      features: ['생시 기반 정밀 분석', '사주 해석'],
      productType: 'saju'
    },
    {
      title: '토정비결',
      price: 7900,
      description: '한 해의 운세를 봅니다',
      features: ['연간 운세', '월별 운세'],
      productType: 'tojung'
    },
    {
      title: '궁합',
      price: 12900,
      description: '두 사람의 궁합을 봅니다',
      features: ['사랑 궁합', '결혼 궁합'],
      productType: 'compatibility'
    },
    {
      title: '재물운',
      price: 5900,
      description: '금전 운세를 봅니다',
      features: ['직업별 맞춤 분석', '투자운'],
      productType: 'wealth'
    },
    {
      title: '연애운',
      price: 6900,
      description: '연애 운세를 봅니다',
      features: ['상태별 맞춤 분석', '이상형 분석'],
      productType: 'love'
    }
  ];

  return (
    <Container>
      <Title>요금제 선택</Title>
      <Subtitle>AI가 분석하는 정확한 운세 서비스</Subtitle>
      <InfoMessage>보셨던 운세는 언제든지 마이페이지에서 다시 확인하실 수 있어요.</InfoMessage>

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