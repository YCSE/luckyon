/**
 * Payment Service
 * 결제 생성, 검증, 완료 처리
 */
import axios from 'axios';
import { db } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, SUBSCRIPTION_PRICES, SERVICE_PRICES } from '../config/constants';
import { generateMerchantUid, generatePaymentId } from '../utils/helpers';
import { Payment } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { PORTONE_IMP_CODE, PORTONE_API_SECRET } from '../config/environment';

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

interface PortOneResponse {
  code: number;
  message: string;
  response: {
    imp_uid: string;
    merchant_uid: string;
    amount: number;
    status: string;
    paid_at: number;
  };
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

      // 5. 결제 문서 생성
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
      // 1. 결제 문서 조회
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

      // 3. merchantUid 일치 확인
      if (portOneData.merchant_uid !== data.merchantUid) {
        throw new AppError(ErrorCode.PAY001, 'merchantUid가 일치하지 않습니다.');
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
        valid: true,
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
      // 1. 결제 문서 조회
      const paymentQuery = await db.collection('payments')
        .where('merchantUid', '==', merchantUid)
        .limit(1)
        .get();

      if (paymentQuery.empty) {
        throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = paymentQuery.docs[0];
      const payment = paymentDoc.data() as Payment;

      // 2. 중복 처리 방지
      if (payment.status === 'completed') {
        throw new AppError(ErrorCode.PAY002, '이미 처리된 결제입니다.');
      }

      const now = Timestamp.now();

      // 3. 결제 타입에 따른 처리
      if (payment.paymentType === 'subscription') {
        // 구독 처리
        await this.processSubscription(payment.uid, payment.productType, now);
      } else {
        // 일회성 결제는 별도 처리 불필요 (운세 생성 시 결제 확인)
      }

      // 4. 결제 상태 업데이트
      await db.collection('payments').doc(paymentDoc.id).update({
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
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `결제 완료 처리 실패: ${error.message}`);
    }
  }

  /**
   * 구독 처리
   */
  private async processSubscription(uid: string, productType: string, now: Timestamp): Promise<void> {
    let days = 0;
    switch (productType) {
      case '1day': days = 1; break;
      case '7days': days = 7; break;
      case '30days': days = 30; break;
      default:
        throw new AppError(ErrorCode.SVC003, '유효하지 않은 구독 상품입니다.');
    }

    const expiresAt = Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);

    await db.collection('users').doc(uid).update({
      currentSubscription: {
        type: productType,
        expiresAt
      },
      updatedAt: now
    });
  }

  /**
   * PortOne API에서 결제 정보 조회
   */
  private async getPortOnePayment(impUid: string): Promise<any> {
    try {
      const impCode = PORTONE_IMP_CODE.value();
      const apiSecret = PORTONE_API_SECRET.value();

      if (!impCode || !apiSecret) {
        throw new AppError(ErrorCode.SYS002, 'PortOne API 설정이 누락되었습니다.');
      }

      // 1. Access Token 발급
      const tokenResponse = await axios.post<PortOneResponse>(
        'https://api.iamport.kr/users/getToken',
        {
          imp_key: impCode,
          imp_secret: apiSecret
        }
      );

      if (tokenResponse.data.code !== 0) {
        throw new Error('PortOne 토큰 발급 실패');
      }

      const accessToken = tokenResponse.data.response;

      // 2. 결제 정보 조회
      const paymentResponse = await axios.get<PortOneResponse>(
        `https://api.iamport.kr/payments/${impUid}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (paymentResponse.data.code !== 0) {
        throw new Error('PortOne 결제 정보 조회 실패');
      }

      return paymentResponse.data.response;
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