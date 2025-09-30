/**
 * Firebase Functions V2 Entry Point
 * LuckyOn AI 운세 서비스
 */
import { onRequest, onCall } from 'firebase-functions/v2/https';
import './config/firebase'; // Firebase Admin 초기화
import { authService } from './services/auth.service';
import { fortuneService } from './services/fortune.service';
import { paymentService } from './services/payment.service';
import { toHttpsError, logError, AppError } from './utils/errors';
import { ErrorCode } from './config/constants';
import {
  validateSignupData,
  validateLoginData,
  validateTodayFortuneData,
  validateSajuData,
  validateTojungData,
  validateCompatibilityData,
  validateWealthData,
  validateLoveData
} from './utils/validators';

// Health check endpoint
export const healthCheck = onRequest(
  {
    region: 'asia-northeast3',
    cors: true,
  },
  async (request, response) => {
    response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'LuckyOn API is running',
    });
  }
);

/**
 * 회원가입
 * @param email - 이메일
 * @param password - 비밀번호 (최소 8자)
 * @param displayName - 이름
 * @param phoneNumber - 전화번호 (optional)
 * @param referralCode - 추천인 코드 (optional, 8자리)
 */
export const authSignup = onCall({
  region: 'asia-northeast3',
  memory: '512MiB',
  maxInstances: 50,
  concurrency: 200
}, async (request) => {
  try {
    const { email, password, displayName, phoneNumber, referralCode } = request.data;

    // 입력값 검증
    validateSignupData({ email, password, displayName, phoneNumber, referralCode });

    // 회원가입 처리
    const result = await authService.signup({
      email,
      password,
      displayName,
      phoneNumber,
      referralCode
    });

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('authSignup', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 로그인
 * @param email - 이메일
 * @param password - 비밀번호
 */
export const authLogin = onCall({
  region: 'asia-northeast3',
  memory: '512MiB',
  concurrency: 200
}, async (request) => {
  try {
    const { email, password } = request.data;

    // 입력값 검증
    validateLoginData({ email, password });

    // 로그인 처리
    const result = await authService.login(email, password);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('authLogin', error, { email: request.data.email });
    throw toHttpsError(error);
  }
});

/**
 * 토큰 검증
 * @param idToken - Firebase ID Token
 */
export const authVerifyToken = onCall({
  region: 'asia-northeast3',
  memory: '256MiB',
  concurrency: 300
}, async (request) => {
  try {
    const { idToken } = request.data;

    if (!idToken) {
      throw new Error('AUTH001: 토큰이 제공되지 않았습니다.');
    }

    // 토큰 검증 및 사용자 정보 조회
    const user = await authService.verifyToken(idToken);

    return {
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        memberGrade: user.memberGrade,
        referralCode: user.referralCode,
        creditBalance: user.creditBalance
      }
    };
  } catch (error: any) {
    logError('authVerifyToken', error);
    throw toHttpsError(error);
  }
});

/**
 * 오늘의 운세 생성
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 */
export const generateTodayFortune = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate } = request.data;

    // 입력값 검증
    validateTodayFortuneData({ name, birthDate });

    // 1. 접근 권한 확인
    const hasAccess = await fortuneService.checkAccess(uid, 'today');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    // 2. 캐시 확인
    const cached = await fortuneService.getCached(uid, 'today', { name, birthDate });
    if (cached) {
      return {
        success: true,
        data: cached
      };
    }

    // 3. 새로운 운세 생성 (임시 paymentId)
    const result = await fortuneService.generateFortune(
      uid,
      'today',
      { name, birthDate },
      'temp_payment_id' // 실제로는 결제 시스템과 연동 필요
    );

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('generateTodayFortune', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 결제 생성
 * @param paymentType - 'oneTime' | 'subscription'
 * @param productType - 서비스 타입 또는 구독 기간
 * @param amount - 결제 금액
 */
export const createPayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { paymentType, productType, amount } = request.data;

    if (!paymentType || !productType || !amount) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const result = await paymentService.createPayment({
      uid,
      paymentType,
      productType,
      amount
    });

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('createPayment', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 결제 검증
 * @param impUid - PortOne 결제 고유번호
 * @param merchantUid - 가맹점 주문번호
 */
export const verifyPayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}, async (request) => {
  try {
    const { impUid, merchantUid } = request.data;

    if (!impUid || !merchantUid) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const result = await paymentService.verifyPayment({
      impUid,
      merchantUid
    });

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('verifyPayment', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 결제 완료 처리
 * @param impUid - PortOne 결제 고유번호
 * @param merchantUid - 가맹점 주문번호
 */
export const completePayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80,
  timeoutSeconds: 30
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { impUid, merchantUid } = request.data;

    if (!impUid || !merchantUid) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const result = await paymentService.completePayment(impUid, merchantUid);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    logError('completePayment', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 사주팔자 분석
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param birthTime - 생시 (HH:MM)
 */
export const generateSajuAnalysis = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate, birthTime } = request.data;
    validateSajuData({ name, birthDate, birthTime });

    const hasAccess = await fortuneService.checkAccess(uid, 'saju');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'saju', { name, birthDate, birthTime });
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await fortuneService.generateFortune(
      uid, 'saju', { name, birthDate, birthTime }, 'temp_payment_id'
    );

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateSajuAnalysis', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 토정비결
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param lunarCalendar - 음력 여부
 */
export const generateTojungSecret = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate, lunarCalendar } = request.data;
    validateTojungData({ name, birthDate, lunarCalendar });

    const hasAccess = await fortuneService.checkAccess(uid, 'tojung');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'tojung', { name, birthDate, lunarCalendar });
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await fortuneService.generateFortune(
      uid, 'tojung', { name, birthDate, lunarCalendar }, 'temp_payment_id'
    );

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateTojungSecret', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 궁합
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param partnerName - 상대방 이름
 * @param partnerBirthDate - 상대방 생년월일 (YYYY-MM-DD)
 */
export const generateCompatibility = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate, partnerName, partnerBirthDate } = request.data;
    validateCompatibilityData({ name, birthDate, partnerName, partnerBirthDate });

    const hasAccess = await fortuneService.checkAccess(uid, 'compatibility');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'compatibility',
      { name, birthDate, partnerName, partnerBirthDate });
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await fortuneService.generateFortune(
      uid, 'compatibility',
      { name, birthDate, partnerName, partnerBirthDate },
      'temp_payment_id'
    );

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateCompatibility', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 재물운
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param jobType - 직업
 */
export const generateWealthFortune = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate, jobType } = request.data;
    validateWealthData({ name, birthDate, jobType });

    const hasAccess = await fortuneService.checkAccess(uid, 'wealth');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'wealth', { name, birthDate, jobType });
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await fortuneService.generateFortune(
      uid, 'wealth', { name, birthDate, jobType }, 'temp_payment_id'
    );

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateWealthFortune', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 연애운
 * @param name - 이름
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param gender - 성별 ('male' | 'female')
 * @param relationshipStatus - 연애 상태 ('single' | 'dating' | 'married' | 'divorced')
 */
export const generateLoveFortune = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 0,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { name, birthDate, gender, relationshipStatus } = request.data;
    validateLoveData({ name, birthDate, gender, relationshipStatus });

    const hasAccess = await fortuneService.checkAccess(uid, 'love');
    if (!hasAccess) {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'love',
      { name, birthDate, gender, relationshipStatus });
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await fortuneService.generateFortune(
      uid, 'love',
      { name, birthDate, gender, relationshipStatus },
      'temp_payment_id'
    );

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateLoveFortune', error, request.data);
    throw toHttpsError(error);
  }
});