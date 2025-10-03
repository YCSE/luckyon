/**
 * Admin Service
 * 관리자 기능
 */
import { db, auth } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, MEMBER_GRADES, MemberGrade } from '../config/constants';
import { Timestamp } from 'firebase-admin/firestore';

interface UserListQuery {
  memberGrade?: string;
  limit?: number;
  startAfter?: string;
}

interface Analytics {
  totalUsers: number;
  usersByGrade: Record<string, number>;
  totalPayments: number;
  totalRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  activeSubscriptions: number;
  totalFortuneGenerated: number;
  fortuneByType: Record<string, number>;
  totalReferralCredits: number;
  pendingWithdrawals: number;
}

export class AdminService {
  /**
   * 관리자 권한 확인
   * @param uid - 사용자 UID
   * @param memberGrade - Custom claims에서 가져온 memberGrade (선택사항)
   */
  private async checkAdminPermission(uid: string, memberGrade?: string): Promise<void> {
    // Custom claims가 제공된 경우 Firestore read 없이 검증 (성능 개선)
    if (memberGrade !== undefined) {
      if (memberGrade !== MEMBER_GRADES.ADMIN) {
        throw new AppError(ErrorCode.AUTH004, '관리자 권한이 필요합니다.');
      }
      return;
    }

    // Custom claims가 없는 경우 기존 방식 (Firestore read)
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    if (userData?.memberGrade !== MEMBER_GRADES.ADMIN) {
      throw new AppError(ErrorCode.AUTH004, '관리자 권한이 필요합니다.');
    }
  }

  /**
   * 사용자 목록 조회
   */
  async getUsersList(adminUid: string, query: UserListQuery = {}, memberGradeFromClaims?: string): Promise<any[]> {
    try {
      await this.checkAdminPermission(adminUid, memberGradeFromClaims);

      const { memberGrade, limit = 50, startAfter } = query;

      let usersQuery = db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (memberGrade) {
        usersQuery = usersQuery.where('memberGrade', '==', memberGrade) as any;
      }

      if (startAfter) {
        const startDoc = await db.collection('users').doc(startAfter).get();
        usersQuery = usersQuery.startAfter(startDoc) as any;
      }

      const snapshot = await usersQuery.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          memberGrade: data.memberGrade,
          referralCode: data.referralCode,
          referredBy: data.referredBy,
          referredUsersCount: data.referredUsers?.length || 0,
          creditBalance: data.creditBalance || 0,
          currentSubscription: data.currentSubscription,
          createdAt: data.createdAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate()
        };
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `사용자 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 사용자 등급 변경
   */
  async updateUserGrade(adminUid: string, targetUid: string, newGrade: MemberGrade, memberGradeFromClaims?: string): Promise<void> {
    try {
      await this.checkAdminPermission(adminUid, memberGradeFromClaims);

      // 유효한 등급인지 확인
      const validGrades = Object.values(MEMBER_GRADES);
      if (!validGrades.includes(newGrade)) {
        throw new AppError(ErrorCode.SVC003, '유효하지 않은 회원 등급입니다.');
      }

      // 대상 사용자 확인
      const userDoc = await db.collection('users').doc(targetUid).get();
      if (!userDoc.exists) {
        throw new AppError(ErrorCode.SVC002, '대상 사용자를 찾을 수 없습니다.');
      }

      // 등급 업데이트
      const now = Timestamp.now();
      await db.collection('users').doc(targetUid).update({
        memberGrade: newGrade,
        updatedAt: now
      });

      // Custom claims 업데이트 (admin 권한 체크 성능 개선)
      await auth.setCustomUserClaims(targetUid, {
        memberGrade: newGrade
      });

      console.log(`User grade updated: ${targetUid} -> ${newGrade} by ${adminUid}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `등급 변경 실패: ${error.message}`);
    }
  }

  /**
   * 서비스 통계 조회
   */
  async getAnalytics(adminUid: string, memberGrade?: string): Promise<Analytics> {
    try {
      await this.checkAdminPermission(adminUid, memberGrade);

      // 1. 사용자 통계
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      const usersByGrade: Record<string, number> = {
        admin: 0,
        member: 0,
        regular: 0,
        special: 0
      };

      usersSnapshot.docs.forEach(doc => {
        const grade = doc.data().memberGrade;
        if (usersByGrade[grade] !== undefined) {
          usersByGrade[grade]++;
        }
      });

      // 2. 결제 통계
      const paymentsSnapshot = await db.collection('payments')
        .where('status', '==', 'completed')
        .get();

      const totalPayments = paymentsSnapshot.size;
      let totalRevenue = 0;

      const revenueByMonthMap: Record<string, number> = {};

      paymentsSnapshot.docs.forEach(doc => {
        const payment = doc.data();
        totalRevenue += payment.amount || 0;

        // 월별 매출
        const createdAt = payment.createdAt?.toDate();
        if (createdAt) {
          const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
          revenueByMonthMap[monthKey] = (revenueByMonthMap[monthKey] || 0) + payment.amount;
        }
      });

      const revenueByMonth = Object.entries(revenueByMonthMap)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // 3. 구독 통계
      let activeSubscriptions = 0;
      const now = new Date();

      usersSnapshot.docs.forEach(doc => {
        const subscription = doc.data().currentSubscription;
        if (subscription && subscription.expiresAt?.toDate() > now) {
          activeSubscriptions++;
        }
      });

      // 4. 운세 생성 통계
      const fortuneSnapshot = await db.collection('fortune_results').get();
      const totalFortuneGenerated = fortuneSnapshot.size;

      const fortuneByType: Record<string, number> = {
        today: 0,
        saju: 0,
        tojung: 0,
        compatibility: 0,
        wealth: 0,
        love: 0
      };

      fortuneSnapshot.docs.forEach(doc => {
        const type = doc.data().serviceType;
        if (fortuneByType[type] !== undefined) {
          fortuneByType[type]++;
        }
      });

      // 5. 리퍼럴 크레딧 통계
      const creditsSnapshot = await db.collection('referral_credits')
        .where('status', '==', 'completed')
        .get();

      const totalReferralCredits = creditsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      // 6. 출금 통계
      const withdrawalsSnapshot = await db.collection('withdrawal_requests')
        .where('status', '==', 'pending')
        .get();

      const pendingWithdrawals = withdrawalsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      return {
        totalUsers,
        usersByGrade,
        totalPayments,
        totalRevenue,
        revenueByMonth,
        activeSubscriptions,
        totalFortuneGenerated,
        fortuneByType,
        totalReferralCredits,
        pendingWithdrawals
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `통계 조회 실패: ${error.message}`);
    }
  }

  /**
   * 시스템 설정 업데이트
   */
  async updateSystemConfig(
    adminUid: string,
    configType: string,
    configData: any,
    memberGrade?: string
  ): Promise<void> {
    try {
      await this.checkAdminPermission(adminUid, memberGrade);

      const now = Timestamp.now();

      await db.collection('system_config').doc(configType).set({
        ...configData,
        updatedAt: now,
        updatedBy: adminUid
      }, { merge: true });

      console.log(`System config updated: ${configType} by ${adminUid}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `설정 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 시스템 설정 조회
   */
  async getSystemConfig(adminUid: string, configType: string, memberGrade?: string): Promise<any> {
    try {
      await this.checkAdminPermission(adminUid, memberGrade);

      const configDoc = await db.collection('system_config').doc(configType).get();

      if (!configDoc.exists) {
        return null;
      }

      return configDoc.data();
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `설정 조회 실패: ${error.message}`);
    }
  }

  /**
   * 사용자 상세 정보 조회 (관리자용)
   */
  async getUserDetail(adminUid: string, targetUid: string, memberGrade?: string): Promise<any> {
    try {
      await this.checkAdminPermission(adminUid, memberGrade);

      const userDoc = await db.collection('users').doc(targetUid).get();
      if (!userDoc.exists) {
        throw new AppError(ErrorCode.SVC002, '사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();

      // 결제 내역
      const paymentsQuery = await db.collection('payments')
        .where('uid', '==', targetUid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const payments = paymentsQuery.docs.map(doc => doc.data());

      // 운세 이용 내역
      const fortunesQuery = await db.collection('fortune_results')
        .where('uid', '==', targetUid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const fortunes = fortunesQuery.docs.map(doc => doc.data());

      // 리퍼럴 크레딧 내역
      const creditsQuery = await db.collection('referral_credits')
        .where('referrerUid', '==', targetUid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const credits = creditsQuery.docs.map(doc => doc.data());

      return {
        user: userData,
        payments,
        fortunes,
        credits
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.SYS001, `사용자 상세 조회 실패: ${error.message}`);
    }
  }
}

// Singleton instance
export const adminService = new AdminService();