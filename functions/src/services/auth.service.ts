/**
 * Authentication Service
 * 사용자 인증 및 회원가입 처리
 */
import * as admin from 'firebase-admin';
import { auth, db } from '../config/firebase';
import { generateReferralCode } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { ErrorCode, MEMBER_GRADES, MemberGrade } from '../config/constants';
import { User } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

interface SignupData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  referralCode?: string;
}

interface SignupResult {
  uid: string;
  email: string;
  displayName: string;
  referralCode: string;
  memberGrade: string;
  customToken: string;
}

interface LoginResult {
  uid: string;
  email: string;
  displayName: string;
  memberGrade: string;
  customToken: string;
}

export class AuthService {
  /**
   * 사용자 회원가입
   */
  async signup(data: SignupData): Promise<SignupResult> {
    try {
      // 1. Firebase Auth 사용자 생성
      const userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber
      });

      // 2. 레퍼럴 코드 생성 (8자리 영문+숫자)
      let referralCode = generateReferralCode();

      // 레퍼럴 코드 중복 확인
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await db.collection('users')
          .where('referralCode', '==', referralCode)
          .limit(1)
          .get();

        if (existing.empty) {
          isUnique = true;
        } else {
          referralCode = generateReferralCode();
          attempts++;
        }
      }

      if (!isUnique) {
        throw new AppError(ErrorCode.SYS001, '레퍼럴 코드 생성 실패');
      }

      // 3. 추천인 확인 및 검증
      let referredBy: string | undefined = undefined;
      if (data.referralCode) {
        const referrerQuery = await db.collection('users')
          .where('referralCode', '==', data.referralCode)
          .limit(1)
          .get();

        if (!referrerQuery.empty) {
          referredBy = referrerQuery.docs[0].id;
        }
      }

      // 4. Firestore 사용자 문서 생성
      const now = Timestamp.now();
      const userData: User = {
        uid: userRecord.uid,
        email: data.email,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        memberGrade: MEMBER_GRADES.MEMBER,
        referralCode,
        referredBy,
        referredUsers: [],
        creditBalance: 0,
        serviceUsage: {
          today: 0,
          saju: 0,
          tojung: 0,
          compatibility: 0,
          wealth: 0,
          love: 0
        },
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

      // 5. 추천인의 referredUsers 배열 업데이트
      if (referredBy) {
        await db.collection('users').doc(referredBy).update({
          referredUsers: admin.firestore.FieldValue.arrayUnion(userRecord.uid),
          updatedAt: now
        });
      }

      // 6. Custom Token 생성
      const customToken = await auth.createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: data.email,
        displayName: data.displayName,
        referralCode,
        memberGrade: MEMBER_GRADES.MEMBER,
        customToken
      };
    } catch (error: any) {
      // Firebase Auth 에러 처리
      if (error.code === 'auth/email-already-exists') {
        throw new AppError(ErrorCode.SVC003, '이미 사용 중인 이메일입니다.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new AppError(ErrorCode.SVC003, '유효하지 않은 이메일 형식입니다.');
      }
      if (error.code === 'auth/invalid-password') {
        throw new AppError(ErrorCode.SVC003, '비밀번호는 최소 6자 이상이어야 합니다.');
      }

      // 커스텀 에러는 그대로 throw
      if (error instanceof AppError) {
        throw error;
      }

      // 알 수 없는 에러
      throw new AppError(ErrorCode.SYS001, `회원가입 실패: ${error.message}`);
    }
  }

  /**
   * 사용자 로그인
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // 1. 이메일로 사용자 조회
      const userRecord = await auth.getUserByEmail(email);

      // 2. Firestore에서 사용자 정보 조회
      const userDoc = await db.collection('users').doc(userRecord.uid).get();

      if (!userDoc.exists) {
        throw new AppError(ErrorCode.AUTH002, '사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data() as User;

      // 3. lastLoginAt 업데이트
      await db.collection('users').doc(userRecord.uid).update({
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 4. Custom Token 생성
      const customToken = await auth.createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        memberGrade: userData.memberGrade,
        customToken
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === 'auth/user-not-found') {
        throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
      }

      throw new AppError(ErrorCode.AUTH002, `로그인 실패: ${error.message}`);
    }
  }

  /**
   * 토큰 검증 및 사용자 정보 조회
   */
  async verifyToken(idToken: string): Promise<User> {
    try {
      // 1. Firebase ID Token 검증
      const decodedToken = await auth.verifyIdToken(idToken);

      // 2. Firestore에서 사용자 정보 조회
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        throw new AppError(ErrorCode.AUTH002, '사용자 정보를 찾을 수 없습니다.');
      }

      return userDoc.data() as User;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === 'auth/id-token-expired') {
        throw new AppError(ErrorCode.AUTH003, '만료된 토큰입니다.');
      }

      if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        throw new AppError(ErrorCode.AUTH002, '유효하지 않은 토큰입니다.');
      }

      throw new AppError(ErrorCode.AUTH002, `토큰 검증 실패: ${error.message}`);
    }
  }

  /**
   * UID로 사용자 조회
   */
  async getUserByUid(uid: string): Promise<User> {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
    }

    return userDoc.data() as User;
  }

  /**
   * 사용자 등급 변경 (관리자용)
   */
  async updateMemberGrade(uid: string, newGrade: MemberGrade): Promise<void> {
    const validGrades = Object.values(MEMBER_GRADES);
    if (!validGrades.includes(newGrade)) {
      throw new AppError(ErrorCode.SVC003, '유효하지 않은 회원 등급입니다.');
    }

    await db.collection('users').doc(uid).update({
      memberGrade: newGrade,
      updatedAt: Timestamp.now()
    });
  }
}

// Singleton instance
export const authService = new AuthService();