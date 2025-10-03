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
import { SUBSCRIPTION_PLANS } from '../../../constants/pricing';

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
  const { user, refreshUserInfo } = useAuth();

  const handlePurchase = async (
    purchaseProductType: string,
    amount: number,
    paymentType: 'oneTime' | 'subscription'
  ) => {
    console.log('[PaymentRequired] handlePurchase called with:', { purchaseProductType, amount, paymentType });

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('[PaymentRequired] User authenticated:', user.uid);

    try {
      // 1. 결제 생성
      console.log('[PaymentRequired] Calling paymentAPI.create...');
      const response: any = await paymentAPI.create({
        paymentType,
        productType: purchaseProductType,
        amount
      });
      console.log('[PaymentRequired] createPayment response:', response);

      if (response.success) {
        const { merchantUid, productName, amount: paymentAmount } = response.data;

        // 2. PortOne V2 결제창 호출 (callback 방식)
        console.log('[PaymentRequired] Calling PortOne.requestPayment...');
        console.log('[PaymentRequired] Payment params:', {
          storeId: import.meta.env.VITE_PORTONE_STORE_ID,
          channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
          paymentId: merchantUid,
          orderName: productName,
          totalAmount: paymentAmount
        });

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

        console.log('[PaymentRequired] PortOne SDK response received!');
        console.log('[PaymentRequired] PortOne SDK response:', portOneResponse);

        // 3. 결제 결과 처리
        if (portOneResponse?.code !== undefined) {
          console.error('[PaymentRequired] Payment failed:', portOneResponse);
          alert(`결제 실패: ${portOneResponse.message}`);
          return;
        }

        // 4. 결제 성공 - 검증 및 완료 처리
        // PortOne V2 SDK는 성공 시 paymentId가 아닌 transactionId를 반환할 수 있음
        const paymentIdFromResponse = portOneResponse?.paymentId || portOneResponse?.transactionId;
        console.log('[PaymentRequired] Payment ID from response:', paymentIdFromResponse);

        if (paymentIdFromResponse) {
          try {
            console.log('[PaymentRequired] Calling verifyPayment with:', { paymentId: paymentIdFromResponse, merchantUid });
            const verifyResponse = await paymentAPI.verify(
              paymentIdFromResponse,
              merchantUid
            );
            console.log('[PaymentRequired] Verify response:', verifyResponse);

            if (verifyResponse.data.success) {
              console.log('[PaymentRequired] Calling completePayment with:', { paymentId: paymentIdFromResponse, merchantUid });
              const completeResponse = await paymentAPI.complete(
                paymentIdFromResponse,
                merchantUid
              );
              console.log('[PaymentRequired] Complete response:', completeResponse);

              if (completeResponse.data.success) {
                console.log('[PaymentRequired] Payment completed successfully:', completeResponse);

                // 사용자 정보를 갱신하여 결제 권한을 업데이트
                console.log('[PaymentRequired] Refreshing user info...');
                await refreshUserInfo();
                console.log('[PaymentRequired] User info refreshed');

                // 결제 타입에 따라 적절한 페이지로 이동
                if (paymentType === 'subscription') {
                  // 구독: 현재 서비스 페이지 reload (이제 접근 가능)
                  alert('결제가 완료되었습니다! 서비스를 이용할 수 있습니다.');
                  console.log('[PaymentRequired] Reloading page after subscription payment');
                  window.location.reload();
                } else {
                  // 일회성: 현재 서비스 페이지 reload (이제 접근 가능)
                  alert('결제가 완료되었습니다! 서비스를 이용할 수 있습니다.');
                  console.log('[PaymentRequired] Reloading page after one-time payment');
                  window.location.reload();
                }
              } else {
                console.error('[PaymentRequired] Payment complete failed:', completeResponse);
                alert('결제 완료 처리 중 오류가 발생했습니다.');
              }
            } else {
              alert('결제 검증에 실패했습니다.');
            }
          } catch (error: any) {
            console.error('[PaymentRequired] Payment verification error:', error);
            alert('결제 확인 중 오류가 발생했습니다: ' + error.message);
          }
        } else {
          // paymentId가 response에 없음
          console.error('[PaymentRequired] No paymentId in response:', portOneResponse);
          alert('결제 응답에서 결제 ID를 찾을 수 없습니다.');
        }
      } else {
        // 결제 생성 실패
        console.error('[PaymentRequired] createPayment failed:', response);
        alert('결제 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error: any) {
      console.error('[PaymentRequired] Payment error:', error);
      console.error('[PaymentRequired] Error details:', error.message, error.code);
      alert('결제 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

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
          {SUBSCRIPTION_PLANS.map((plan) => (
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
