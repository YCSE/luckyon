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
import { PORTONE_STORE_ID, PORTONE_API_SECRET } from '../config/environment';

interface CreatePaymentData {
  uid: string;
  paymentType: 'oneTime' | 'subscription';
  productType: string; // 'today', 'saju', '1day', '7days', etc.
  amount: number;
}

interface VerifyPaymentData {
  impUid: string;
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
  status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED';
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

      // 결제 문서 생성
      await db.collection('payments').doc(paymentId).set(payment);

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
      // 1. 결제 문서 조회 (merchantUid로 쿼리)
      const paymentQuery = await db.collection('payments')
        .where('merchantUid', '==', data.merchantUid)
        .limit(1)
        .get();

      if (paymentQuery.empty) {
        throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = paymentQuery.docs[0];
      const payment = paymentDoc.data() as Payment;

      // 2. PortOne API 호출하여 검증
      const portOneData = await this.getPortOnePayment(data.impUid);

      // 3. paymentId(imp_uid) 일치 확인
      // portOneData.imp_uid는 PortOne V2의 payment ID이며, 이를 data.impUid와 비교해야 함
      if (portOneData.imp_uid !== data.impUid) {
        throw new AppError(ErrorCode.PAY001, 'paymentId가 일치하지 않습니다.');
      }

      // 4. 금액 일치 확인
      if (portOneData.amount !== payment.amount) {
        throw new AppError(ErrorCode.PAY001, '결제 금액이 일치하지 않습니다.');
      }

      // 5. 결제 상태 확인
      if (portOneData.status !== 'paid') {
        throw new AppError(ErrorCode.PAY001, '결제가 완료되지 않았습니다.');
      }

      return {
        success: true,
        impUid: data.impUid,
        merchantUid: data.merchantUid,
        amount: portOneData.amount,
        status: portOneData.status
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.PAY001, `결제 검증 실패: ${error.message}`);
    }
  }

  /**
   * 결제 완료 처리
   */
  async completePayment(impUid: string, merchantUid: string): Promise<any> {
    try {
      // Transaction을 사용하여 동시성 제어 및 원자성 보장
      const result = await db.runTransaction(async (transaction) => {
        // 1. 결제 문서 조회 (merchantUid로 쿼리)
        const paymentQuery = await db.collection('payments')
          .where('merchantUid', '==', merchantUid)
          .limit(1)
          .get();

        if (paymentQuery.empty) {
          throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
        }

        const paymentDoc = paymentQuery.docs[0];
        const paymentRef = paymentDoc.ref;
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
          transaction.update(db.collection('users').doc(payment.uid), {
            currentSubscription: {
              type: payment.productType,
              expiresAt
            },
            updatedAt: now
          });
        } else {
          // 일회성 결제 - oneTimePurchases 배열에 추가
          transaction.update(db.collection('users').doc(payment.uid), {
            oneTimePurchases: admin.firestore.FieldValue.arrayUnion(payment.productType),
            updatedAt: now
          });
        }

        // 4. 결제 상태 업데이트
        transaction.update(paymentRef, {
          impUid,
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
   * PortOne V2 API에서 결제 정보 조회
   */
  private async getPortOnePayment(paymentId: string): Promise<any> {
    try {
      const storeId = PORTONE_STORE_ID;
      const apiSecret = PORTONE_API_SECRET;

      if (!storeId || !apiSecret) {
        throw new AppError(ErrorCode.SYS002, 'PortOne API 설정이 누락되었습니다.');
      }

      // PortOne V2 API: 토큰 발급 없이 직접 인증
      const paymentResponse = await axios.get<PortOneV2PaymentResponse>(
        `https://api.portone.io/payments/${paymentId}`,
        {
          headers: {
            Authorization: `PortOne ${apiSecret}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // V2 응답: id가 우리의 merchantUid (우리가 paymentId로 지정했으므로)
      return {
        imp_uid: paymentResponse.data.id,
        amount: paymentResponse.data.amount.total,
        status: paymentResponse.data.status === 'PAID' ? 'paid' : paymentResponse.data.status.toLowerCase(),
        paid_at: paymentResponse.data.paidAt ? new Date(paymentResponse.data.paidAt).getTime() / 1000 : undefined
      };
    } catch (error: any) {
      throw new AppError(ErrorCode.SYS002, `PortOne API 오류: ${error.message}`);
    }
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