/**
 * Payment Service
 * 결제 생성, 검증, 완료 처리
 */
import axios from 'axios';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, SUBSCRIPTION_PRICES, SERVICE_PRICES } from '../config/constants';
import { generateMerchantUid, generatePaymentId } from '../utils/helpers';
import { Payment } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { PORTONE_API_SECRET } from '../config/environment';

interface CreatePaymentData {
  uid: string;
  paymentType: 'oneTime' | 'subscription';
  productType: string; // 'today', 'saju', '1day', '7days', etc.
  amount: number;
}

interface VerifyPaymentData {
  paymentId: string;  // PortOne V2 paymentId (우리가 요청 시 보낸 merchantUid)
  merchantUid: string;
}

// PortOne V2 Response 타입
interface PortOneV2PaymentResponse {
  id: string;
  storeId: string;
  orderName: string;
  amount: {
    total: number;
    currency: string;
  };
  status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PARTIAL_CANCELLED' | 'PAY_PENDING' | 'VIRTUAL_ACCOUNT_ISSUED';
  paidAt?: string;
}

export class PaymentService {
  /**
   * 결제 생성
   */
  async createPayment(data: CreatePaymentData): Promise<any> {
    try {
      // 1. 사용자 확인
      const userDoc = await db.collection('users').doc(data.uid).get();
      if (!userDoc.exists) {
        throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
      }

      // 2. merchantUid 생성
      const merchantUid = generateMerchantUid();
      const paymentId = generatePaymentId();

      // 3. 상품명 및 금액 검증
      let productName = '';
      let expectedAmount = data.amount;

      if (data.paymentType === 'subscription') {
        switch (data.productType) {
          case '1day':
            productName = 'LuckyOn 1일 이용권';
            expectedAmount = SUBSCRIPTION_PRICES['1day'];
            break;
          case '7days':
            productName = 'LuckyOn 7일 이용권';
            expectedAmount = SUBSCRIPTION_PRICES['7days'];
            break;
          case '30days':
            productName = 'LuckyOn 30일 이용권';
            expectedAmount = SUBSCRIPTION_PRICES['30days'];
            break;
          default:
            throw new AppError(ErrorCode.SVC003, '유효하지 않은 구독 상품입니다.');
        }
      } else {
        // oneTime
        const serviceType = data.productType as keyof typeof SERVICE_PRICES;
        if (!SERVICE_PRICES[serviceType]) {
          throw new AppError(ErrorCode.SVC003, '유효하지 않은 서비스 타입입니다.');
        }
        productName = `LuckyOn ${this.getServiceName(data.productType)}`;
        expectedAmount = SERVICE_PRICES[serviceType];
      }

      // 금액 검증
      if (data.amount !== expectedAmount) {
        throw new AppError(ErrorCode.PAY001, '결제 금액이 일치하지 않습니다.');
      }

      // 4. 추천인 확인
      const userData = userDoc.data();
      let referralCredit = undefined;

      if (userData?.referredBy) {
        const referrerDoc = await db.collection('users').doc(userData.referredBy).get();
        if (referrerDoc.exists) {
          const referrerData = referrerDoc.data();
          let percentage = 0;

          switch (referrerData?.memberGrade) {
            case 'regular': percentage = 0.5; break;
            case 'special': percentage = 0.7; break;
            case 'admin': percentage = 0.7; break;
            default: percentage = 0;
          }

          if (percentage > 0) {
            referralCredit = {
              referrerUid: userData.referredBy,
              creditAmount: Math.floor(data.amount * percentage),
              percentage
            };
          }
        }
      }

      // 5. 결제 문서 생성 (merchantUid를 document ID로 사용하여 성능 최적화)
      const now = Timestamp.now();
      const payment: Payment = {
        paymentId,
        uid: data.uid,
        merchantUid,
        impUid: '', // PortOne 결제 후 업데이트
        paymentType: data.paymentType,
        productType: data.productType,
        productName,
        amount: data.amount,
        status: 'pending',
        pgProvider: 'KCP',
        referralCredit,
        createdAt: now
      };

      // 결제 문서 생성 (merchantUid를 document ID로 사용)
      await db.collection('payments').doc(merchantUid).set(payment);

      return {
        paymentId,
        merchantUid,
        productName,
        amount: data.amount
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `결제 생성 실패: ${error.message}`);
    }
  }

  /**
   * PortOne 결제 검증
   */
  async verifyPayment(data: VerifyPaymentData): Promise<any> {
    try {
      // 1. 결제 문서 조회 (merchantUid로 직접 조회 - 성능 최적화)
      const paymentDoc = await db.collection('payments').doc(data.merchantUid).get();

      if (!paymentDoc.exists) {
        throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
      }

      const payment = paymentDoc.data() as Payment;

      // 2. PortOne API 호출하여 결제 상태 조회
      // paymentId는 클라이언트가 PortOne SDK로부터 받은 응답 (우리의 merchantUid와 동일)
      const portOnePayment = await this.getPortOnePayment(data.paymentId);

      // 3. paymentId 일치 확인
      // PortOne V2: 우리가 보낸 paymentId(merchantUid)가 응답의 id 필드에 그대로 반환됨
      if (portOnePayment.id !== data.merchantUid) {
        console.error('[PaymentService] Payment ID mismatch:', {
          expected: data.merchantUid,
          received: portOnePayment.id,
          paymentId: data.paymentId
        });
        throw new AppError(ErrorCode.PAY001, 'paymentId가 일치하지 않습니다.');
      }

      // 4. 금액 일치 확인
      if (portOnePayment.amount !== payment.amount) {
        console.error('[PaymentService] Amount mismatch:', {
          expected: payment.amount,
          received: portOnePayment.amount
        });
        throw new AppError(ErrorCode.PAY001, '결제 금액이 일치하지 않습니다.');
      }

      // 5. 결제 상태 확인
      if (portOnePayment.status !== 'PAID') {
        console.error('[PaymentService] Invalid payment status:', {
          status: portOnePayment.status,
          merchantUid: data.merchantUid
        });
        // 상태별 명확한 에러 메시지
        switch (portOnePayment.status) {
          case 'READY':
            throw new AppError(ErrorCode.PAY001, '결제 대기 중입니다.');
          case 'FAILED':
            throw new AppError(ErrorCode.PAY001, '결제가 실패했습니다.');
          case 'CANCELLED':
            throw new AppError(ErrorCode.PAY001, '결제가 취소되었습니다.');
          case 'PARTIAL_CANCELLED':
            throw new AppError(ErrorCode.PAY001, '결제가 부분 취소되었습니다.');
          case 'PAY_PENDING':
            throw new AppError(ErrorCode.PAY001, '결제 승인 대기 중입니다.');
          case 'VIRTUAL_ACCOUNT_ISSUED':
            throw new AppError(ErrorCode.PAY001, '가상계좌가 발급되었습니다.');
          default:
            throw new AppError(ErrorCode.PAY001, `알 수 없는 결제 상태: ${portOnePayment.status}`);
        }
      }

      return {
        success: true,
        paymentId: data.paymentId,
        merchantUid: data.merchantUid,
        amount: portOnePayment.amount,
        status: portOnePayment.status
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[PaymentService] Verify payment error:', error);
      throw new AppError(ErrorCode.PAY001, `결제 검증 실패: ${error.message}`);
    }
  }

  /**
   * 결제 완료 처리
   */
  async completePayment(paymentId: string, merchantUid: string): Promise<any> {
    try {
      // Transaction을 사용하여 동시성 제어 및 원자성 보장
      const result = await db.runTransaction(async (transaction) => {
        // 1. 결제 문서 조회 (merchantUid로 직접 조회 - 성능 최적화)
        const paymentRef = db.collection('payments').doc(merchantUid);
        const paymentDoc = await transaction.get(paymentRef);

        if (!paymentDoc.exists) {
          throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
        }

        const payment = paymentDoc.data() as Payment;

        // 2. 중복 처리 방지
        if (payment.status === 'completed') {
          throw new AppError(ErrorCode.PAY002, '이미 처리된 결제입니다.');
        }

        const now = Timestamp.now();

        // 3. 결제 타입에 따른 처리
        if (payment.paymentType === 'subscription') {
          // 구독 처리 - Transaction 내에서 사용자 문서 업데이트
          const expiresAt = this.calculateSubscriptionExpiry(payment.productType);
          console.log(`[PaymentService] Updating subscription for user ${payment.uid}:`, {
            type: payment.productType,
            expiresAt
          });
          transaction.update(db.collection('users').doc(payment.uid), {
            currentSubscription: {
              type: payment.productType,
              expiresAt
            },
            updatedAt: now
          });
        } else {
          // 일회성 결제 - oneTimePurchases 배열에 추가
          console.log(`[PaymentService] Adding one-time purchase for user ${payment.uid}:`, payment.productType);
          transaction.update(db.collection('users').doc(payment.uid), {
            oneTimePurchases: admin.firestore.FieldValue.arrayUnion(payment.productType),
            updatedAt: now
          });
        }

        // 4. 결제 상태 업데이트
        transaction.update(paymentRef, {
          impUid: paymentId,  // PortOne V2 paymentId를 impUid 필드에 저장 (기존 스키마 호환성)
          status: 'completed',
          completedAt: now,
          updatedAt: now
        });

        // 5. 리퍼럴 크레딧 처리는 트리거가 자동 처리

        return {
          success: true,
          paymentId: payment.paymentId,
          paymentType: payment.paymentType,
          productType: payment.productType
        };
      });

      return result;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `결제 완료 처리 실패: ${error.message}`);
    }
  }

  /**
   * 구독 만료일 계산
   */
  private calculateSubscriptionExpiry(productType: string): Timestamp {
    let days = 0;
    switch (productType) {
      case '1day': days = 1; break;
      case '7days': days = 7; break;
      case '30days': days = 30; break;
      default:
        throw new AppError(ErrorCode.SVC003, '유효하지 않은 구독 상품입니다.');
    }

    return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * PortOne V2 API에서 결제 정보 조회 (Retry 로직 포함)
   */
  private async getPortOnePayment(paymentId: string, retries = 3): Promise<{
    id: string;
    amount: number;
    status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PARTIAL_CANCELLED' | 'PAY_PENDING' | 'VIRTUAL_ACCOUNT_ISSUED';
    paidAt?: number;
  }> {
    // 환경변수는 함수 초기화 시점에 검증됨
    const apiSecret = PORTONE_API_SECRET;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // PortOne V2 API: 토큰 발급 없이 직접 인증
        const paymentResponse = await axios.get<PortOneV2PaymentResponse>(
          `https://api.portone.io/payments/${paymentId}`,
          {
            headers: {
              Authorization: `PortOne ${apiSecret}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10초 timeout
          }
        );

        console.log('[PaymentService] PortOne API response:', {
          id: paymentResponse.data.id,
          status: paymentResponse.data.status,
          amount: paymentResponse.data.amount.total
        });

        // PortOne V2 응답 구조:
        // - id: 우리가 요청 시 보낸 paymentId (merchantUid)
        // - status: READY | PAID | FAILED | CANCELLED 등
        // - amount.total: 결제 금액
        return {
          id: paymentResponse.data.id,
          amount: paymentResponse.data.amount.total,
          status: paymentResponse.data.status,
          paidAt: paymentResponse.data.paidAt ? new Date(paymentResponse.data.paidAt).getTime() / 1000 : undefined
        };
      } catch (error: any) {
        const isLastAttempt = attempt === retries - 1;
        const is404 = error.response?.status === 404;

        console.error(`[PaymentService] PortOne API error (attempt ${attempt + 1}/${retries}):`, {
          paymentId,
          status: error.response?.status,
          error: error.response?.data || error.message
        });

        // 404 에러는 재시도하지 않음 (결제 정보 없음)
        if (is404 || isLastAttempt) {
          throw new AppError(
            ErrorCode.SYS002,
            `PortOne API 오류: ${error.response?.data?.message || error.message}`
          );
        }

        // 재시도 전 대기 (exponential backoff)
        const waitTime = 1000 * (attempt + 1);
        console.log(`[PaymentService] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // 이 코드에 도달하면 안되지만 TypeScript를 위해 추가
    throw new AppError(ErrorCode.SYS002, 'PortOne API 호출 실패');
  }

  /**
   * 서비스 이름 변환
   */
  private getServiceName(serviceType: string): string {
    const names: Record<string, string> = {
      today: '오늘의 운세',
      saju: '사주팔자',
      tojung: '토정비결',
      compatibility: '궁합',
      wealth: '재물운',
      love: '연애운'
    };
    return names[serviceType] || serviceType;
  }

  /**
   * 결제 내역 조회
   */
  async getPaymentHistory(uid: string, limit: number = 20): Promise<any[]> {
    const paymentsQuery = await db.collection('payments')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return paymentsQuery.docs.map(doc => ({
      paymentId: doc.id,
      ...doc.data()
    }));
  }
}

// Singleton instance
export const paymentService = new PaymentService();