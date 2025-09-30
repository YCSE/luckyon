/**
 * Referral Service
 * 리퍼럴 크레딧 및 출금 관리
 */
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, MEMBER_GRADES } from '../config/constants';
import { generateWithdrawalId } from '../utils/helpers';
import { Timestamp } from 'firebase-admin/firestore';

interface ReferralCredit {
  referrerUid: string;
  creditAmount: number;
  percentage: number;
}

interface ReferralStats {
  totalEarnings: number;
  availableBalance: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  referredUsersCount: number;
  referredUsers: Array<{
    uid: string;
    displayName: string;
    memberGrade: string;
    joinedAt: Date;
    totalPayments: number;
  }>;
}

interface WithdrawalRequest {
  withdrawalId: string;
  uid: string;
  amount: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  note?: string;
}

export class ReferralService {
  /**
   * 결제 완료 시 리퍼럴 크레딧 처리
   */
  async processReferralCredit(paymentId: string): Promise<void> {
    try {
      // 1. 결제 정보 조회
      const paymentDoc = await db.collection('payments').doc(paymentId).get();
      if (!paymentDoc.exists) {
        throw new AppError(ErrorCode.PAY001, '결제 정보를 찾을 수 없습니다.');
      }

      const payment = paymentDoc.data();

      // 2. 리퍼럴 크레딧이 없으면 종료
      if (!payment?.referralCredit) {
        return;
      }

      const { referrerUid, creditAmount, percentage } = payment.referralCredit as ReferralCredit;

      // 3. 추천인 정보 확인
      const referrerDoc = await db.collection('users').doc(referrerUid).get();
      if (!referrerDoc.exists) {
        console.error(`Referrer not found: ${referrerUid}`);
        return;
      }

      const now = Timestamp.now();

      // 4. referral_credits 컬렉션에 기록 추가
      const creditId = `${paymentId}_credit`;
      await db.collection('referral_credits').doc(creditId).set({
        creditId,
        referrerUid,
        referredUid: payment.uid,
        paymentId,
        amount: creditAmount,
        percentage,
        productType: payment.productType,
        productName: payment.productName,
        originalAmount: payment.amount,
        status: 'completed',
        createdAt: now
      });

      // 5. 추천인의 creditBalance 업데이트
      await db.collection('users').doc(referrerUid).update({
        creditBalance: admin.firestore.FieldValue.increment(creditAmount),
        updatedAt: now
      });

      console.log(`Referral credit processed: ${creditAmount} to ${referrerUid} from payment ${paymentId}`);
    } catch (error: any) {
      console.error('Referral credit processing error:', error);
      // 에러가 발생해도 결제 완료는 유지 (크레딧 처리만 실패)
    }
  }

  /**
   * 리퍼럴 통계 조회
   */
  async getReferralStats(uid: string): Promise<ReferralStats> {
    try {
      // 1. 사용자 정보 조회
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();

      // 2. 총 적립 크레딧 계산
      const creditsQuery = await db.collection('referral_credits')
        .where('referrerUid', '==', uid)
        .where('status', '==', 'completed')
        .get();

      const totalEarnings = creditsQuery.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      // 3. 출금 내역 조회
      const withdrawalsQuery = await db.collection('withdrawal_requests')
        .where('uid', '==', uid)
        .get();

      let pendingWithdrawals = 0;
      let completedWithdrawals = 0;

      withdrawalsQuery.docs.forEach(doc => {
        const withdrawal = doc.data();
        if (withdrawal.status === 'pending' || withdrawal.status === 'approved') {
          pendingWithdrawals += withdrawal.amount || 0;
        } else if (withdrawal.status === 'completed') {
          completedWithdrawals += withdrawal.amount || 0;
        }
      });

      // 4. 추천한 사용자 목록
      const referredUsers = userData?.referredUsers || [];
      const referredUsersDetails = await Promise.all(
        referredUsers.map(async (referredUid: string) => {
          const referredDoc = await db.collection('users').doc(referredUid).get();
          if (!referredDoc.exists) return null;

          const referredData = referredDoc.data();

          // 해당 사용자의 결제 총액
          const paymentsQuery = await db.collection('payments')
            .where('uid', '==', referredUid)
            .where('status', '==', 'completed')
            .get();

          const totalPayments = paymentsQuery.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
          }, 0);

          return {
            uid: referredUid,
            displayName: referredData?.displayName || '알 수 없음',
            memberGrade: referredData?.memberGrade || 'member',
            joinedAt: referredData?.createdAt?.toDate() || new Date(),
            totalPayments
          };
        })
      );

      return {
        totalEarnings,
        availableBalance: userData?.creditBalance || 0,
        pendingWithdrawals,
        completedWithdrawals,
        referredUsersCount: referredUsers.length,
        referredUsers: referredUsersDetails.filter(Boolean) as any[]
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `리퍼럴 통계 조회 실패: ${error.message}`);
    }
  }

  /**
   * 출금 요청
   */
  async requestWithdrawal(
    uid: string,
    amount: number,
    bankAccount: { bankName: string; accountNumber: string; accountHolder: string }
  ): Promise<string> {
    try {
      // 1. 사용자 정보 조회
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();

      // 2. 회원 등급 확인 (member는 출금 불가)
      if (userData?.memberGrade === MEMBER_GRADES.MEMBER) {
        throw new AppError(ErrorCode.SVC001, '정회원 이상만 출금이 가능합니다.');
      }

      // 3. 잔액 확인
      const currentBalance = userData?.creditBalance || 0;
      if (currentBalance < amount) {
        throw new AppError(ErrorCode.SVC002, '출금 가능 금액이 부족합니다.');
      }

      // 4. 최소 출금 금액 확인 (10,000원)
      if (amount < 10000) {
        throw new AppError(ErrorCode.SVC003, '최소 출금 금액은 10,000원입니다.');
      }

      // 5. 출금 요청 생성
      const withdrawalId = generateWithdrawalId();
      const now = Timestamp.now();

      const withdrawalRequest: WithdrawalRequest = {
        withdrawalId,
        uid,
        amount,
        bankAccount,
        status: 'pending',
        requestedAt: now
      };

      await db.collection('withdrawal_requests').doc(withdrawalId).set(withdrawalRequest);

      // 6. 사용자 잔액에서 차감 (출금 대기 상태)
      await db.collection('users').doc(uid).update({
        creditBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: now
      });

      return withdrawalId;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `출금 요청 실패: ${error.message}`);
    }
  }

  /**
   * 출금 승인 (관리자)
   */
  async approveWithdrawal(withdrawalId: string, adminUid: string, note?: string): Promise<void> {
    try {
      // 1. 관리자 권한 확인
      const adminDoc = await db.collection('users').doc(adminUid).get();
      if (!adminDoc.exists || adminDoc.data()?.memberGrade !== MEMBER_GRADES.ADMIN) {
        throw new AppError(ErrorCode.SVC001, '관리자 권한이 필요합니다.');
      }

      // 2. 출금 요청 조회
      const withdrawalDoc = await db.collection('withdrawal_requests').doc(withdrawalId).get();
      if (!withdrawalDoc.exists) {
        throw new AppError(ErrorCode.SVC002, '출금 요청을 찾을 수 없습니다.');
      }

      const withdrawal = withdrawalDoc.data() as WithdrawalRequest;

      // 3. 상태 확인
      if (withdrawal.status !== 'pending') {
        throw new AppError(ErrorCode.SVC003, '이미 처리된 출금 요청입니다.');
      }

      // 4. 출금 승인 처리
      const now = Timestamp.now();
      await db.collection('withdrawal_requests').doc(withdrawalId).update({
        status: 'completed',
        processedAt: now,
        processedBy: adminUid,
        note: note || '출금 완료'
      });

      console.log(`Withdrawal approved: ${withdrawalId} by ${adminUid}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `출금 승인 실패: ${error.message}`);
    }
  }

  /**
   * 출금 거부 (관리자)
   */
  async rejectWithdrawal(withdrawalId: string, adminUid: string, note: string): Promise<void> {
    try {
      // 1. 관리자 권한 확인
      const adminDoc = await db.collection('users').doc(adminUid).get();
      if (!adminDoc.exists || adminDoc.data()?.memberGrade !== MEMBER_GRADES.ADMIN) {
        throw new AppError(ErrorCode.SVC001, '관리자 권한이 필요합니다.');
      }

      // 2. 출금 요청 조회
      const withdrawalDoc = await db.collection('withdrawal_requests').doc(withdrawalId).get();
      if (!withdrawalDoc.exists) {
        throw new AppError(ErrorCode.SVC002, '출금 요청을 찾을 수 없습니다.');
      }

      const withdrawal = withdrawalDoc.data() as WithdrawalRequest;

      // 3. 상태 확인
      if (withdrawal.status !== 'pending') {
        throw new AppError(ErrorCode.SVC003, '이미 처리된 출금 요청입니다.');
      }

      const now = Timestamp.now();

      // 4. 출금 거부 처리
      await db.collection('withdrawal_requests').doc(withdrawalId).update({
        status: 'rejected',
        processedAt: now,
        processedBy: adminUid,
        note
      });

      // 5. 사용자 잔액 복구
      await db.collection('users').doc(withdrawal.uid).update({
        creditBalance: admin.firestore.FieldValue.increment(withdrawal.amount),
        updatedAt: now
      });

      console.log(`Withdrawal rejected: ${withdrawalId} by ${adminUid}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `출금 거부 실패: ${error.message}`);
    }
  }

  /**
   * 출금 요청 목록 조회 (관리자)
   */
  async getWithdrawalRequests(status?: string, limit: number = 50): Promise<any[]> {
    try {
      let query = db.collection('withdrawal_requests')
        .orderBy('requestedAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ withdrawalId: doc.id, ...doc.data() }));
    } catch (error: any) {
      throw new AppError(ErrorCode.SYS001, `출금 요청 목록 조회 실패: ${error.message}`);
    }
  }
}

// Singleton instance
export const referralService = new ReferralService();