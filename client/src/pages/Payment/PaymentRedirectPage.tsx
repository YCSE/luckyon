/**
 * PaymentRedirectPage
 * 포트원 결제 완료 후 리다이렉트되는 페이지
 * 쿼리 파라미터로 결제 결과를 받아 검증 및 완료 처리
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../design-system/tokens';

export const PaymentRedirectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUserInfo } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제 처리 중입니다...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // 쿼리 파라미터에서 결제 정보 추출
        const paymentId = searchParams.get('paymentId');
        const code = searchParams.get('code');
        const errorMessage = searchParams.get('message');

        console.log('[PaymentRedirect] Query params:', {
          paymentId,
          code,
          errorMessage
        });

        // 결제 실패 처리
        if (code !== null && code !== undefined) {
          console.error('[PaymentRedirect] Payment failed:', { code, errorMessage });
          setStatus('error');
          setMessage(`결제 실패: ${errorMessage || '알 수 없는 오류'}`);

          setTimeout(() => {
            navigate('/pricing');
          }, 3000);
          return;
        }

        // paymentId 없음
        if (!paymentId) {
          console.error('[PaymentRedirect] No paymentId in query params');
          setStatus('error');
          setMessage('결제 정보를 찾을 수 없습니다.');

          setTimeout(() => {
            navigate('/pricing');
          }, 3000);
          return;
        }

        // merchantUid를 sessionStorage에서 가져오기
        const merchantUid = sessionStorage.getItem('payment_merchantUid');
        const returnPath = sessionStorage.getItem('payment_returnPath') || '/';

        console.log('[PaymentRedirect] Retrieved from sessionStorage:', {
          merchantUid,
          returnPath
        });

        if (!merchantUid) {
          console.error('[PaymentRedirect] No merchantUid in sessionStorage');
          setStatus('error');
          setMessage('결제 정보가 유효하지 않습니다.');

          setTimeout(() => {
            navigate('/pricing');
          }, 3000);
          return;
        }

        // 1. 결제 검증
        console.log('[PaymentRedirect] Calling verifyPayment...');
        const verifyResponse: any = await paymentAPI.verify(paymentId, merchantUid);
        console.log('[PaymentRedirect] Verify response:', verifyResponse);

        if (!verifyResponse.success) {
          setStatus('error');
          setMessage('결제 검증에 실패했습니다.');

          setTimeout(() => {
            navigate('/pricing');
          }, 3000);
          return;
        }

        // 2. 결제 완료 처리
        console.log('[PaymentRedirect] Calling completePayment...');
        const completeResponse: any = await paymentAPI.complete(paymentId, merchantUid);
        console.log('[PaymentRedirect] Complete response:', completeResponse);

        if (completeResponse.success) {
          // 3. 사용자 정보 갱신
          console.log('[PaymentRedirect] Refreshing user info...');
          await refreshUserInfo();
          console.log('[PaymentRedirect] User info refreshed');

          // 4. sessionStorage 정리
          sessionStorage.removeItem('payment_merchantUid');
          sessionStorage.removeItem('payment_returnPath');

          setStatus('success');
          setMessage('결제가 완료되었습니다!');

          // 3초 후 원래 페이지로 이동
          setTimeout(() => {
            window.location.href = returnPath;
          }, 2000);
        } else {
          setStatus('error');
          setMessage('결제 완료 처리 중 오류가 발생했습니다.');

          setTimeout(() => {
            navigate('/pricing');
          }, 3000);
        }
      } catch (error: any) {
        console.error('[PaymentRedirect] Error:', error);
        setStatus('error');
        setMessage(`오류 발생: ${error.message}`);

        setTimeout(() => {
          navigate('/pricing');
        }, 3000);
      }
    };

    processPayment();
  }, [searchParams, navigate, refreshUserInfo]);

  return (
    <Container>
      <Card>
        {status === 'processing' && (
          <>
            <Spinner />
            <Message>{message}</Message>
          </>
        )}

        {status === 'success' && (
          <>
            <SuccessIcon>✓</SuccessIcon>
            <Message>{message}</Message>
            <SubMessage>서비스 페이지로 이동합니다...</SubMessage>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon>✗</ErrorIcon>
            <Message>{message}</Message>
            <SubMessage>요금제 페이지로 이동합니다...</SubMessage>
          </>
        )}
      </Card>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${tokens.colors.neutral[50]};
  padding: ${tokens.spacing[6]};
`;

const Card = styled.div`
  background: ${tokens.colors.neutral[0]};
  border-radius: ${tokens.borderRadius.lg};
  padding: ${tokens.spacing[8]};
  box-shadow: ${tokens.shadows.md};
  text-align: center;
  min-width: 400px;

  @media (max-width: 600px) {
    min-width: auto;
    width: 100%;
  }
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${tokens.colors.neutral[200]};
  border-top-color: ${tokens.colors.primary[500]};
  border-radius: 50%;
  margin: 0 auto ${tokens.spacing[4]};
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${tokens.spacing[4]};
  background: ${tokens.colors.fortune.excellent};
  color: ${tokens.colors.neutral[0]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: ${tokens.typography.fontWeight.bold};
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${tokens.spacing[4]};
  background: ${tokens.colors.semantic.error};
  color: ${tokens.colors.neutral[0]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: ${tokens.typography.fontWeight.bold};
`;

const Message = styled.p`
  font-size: ${tokens.typography.fontSize.xl};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.neutral[800]};
  margin-bottom: ${tokens.spacing[2]};
`;

const SubMessage = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.neutral[600]};
`;
