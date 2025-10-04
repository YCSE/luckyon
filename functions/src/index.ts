/**
 * Firebase Functions V2 Entry Point
 * LuckyOn AI 운세 서비스
 */
import { onRequest, onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import './config/firebase'; // Firebase Admin 초기화
import { validateEnvironment } from './config/environment';
import { authService } from './services/auth.service';
import { fortuneService } from './services/fortune.service';
import { paymentService } from './services/payment.service';
import { referralService } from './services/referral.service';
import { adminService } from './services/admin.service';
import { toHttpsError, logError, AppError } from './utils/errors';
import { ErrorCode, ServiceType } from './config/constants';
import { db } from './config/firebase';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
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

// 환경변수 검증 (Functions 초기화 시점에 실행)
if (!validateEnvironment()) {
  console.error('[Functions Init] WARNING: Required environment variables are missing!');
  console.error('[Functions Init] Please set GEMINI_API_KEY, PORTONE_STORE_ID, and PORTONE_API_SECRET');
  console.error('[Functions Init] Functions will deploy but may fail at runtime');
}

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
 * 일회성 결제 권한 확인 및 예약 (Transaction 기반)
 * Race condition 방지를 위해 구독 확인 + 일회성 구매 소진을 atomic하게 처리
 * @returns 'subscription' | 'oneTime' | 'none'
 */
async function checkAndReserveOneTimePurchase(
  uid: string,
  serviceType: ServiceType
): Promise<'subscription' | 'oneTime' | 'none'> {
  return await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      return 'none';
    }

    const userData = userDoc.data();

    // 1. 구독 확인 (우선순위 높음)
    if (userData?.currentSubscription) {
      const expiresAt = userData.currentSubscription.expiresAt.toDate();
      const now = new Date();

      if (expiresAt > now) {
        console.log(`[AccessCheck] User ${uid} accessed ${serviceType} via subscription`);
        return 'subscription';
      }
    }

    // 2. 일회성 구매 확인 및 소진 (Transaction 내에서 atomic하게 처리)
    const oneTimePurchases = userData?.oneTimePurchases || [];
    if (Array.isArray(oneTimePurchases) && oneTimePurchases.includes(serviceType)) {
      // Transaction 내에서 바로 제거 - race condition 방지
      transaction.update(userRef, {
        oneTimePurchases: admin.firestore.FieldValue.arrayRemove(serviceType)
      });
      console.log(`[AccessCheck] User ${uid} reserved one-time access for ${serviceType}`);
      return 'oneTime';
    }

    // 3. 접근 권한 없음
    return 'none';
  });
}

/**
 * 일회성 구매 복원 (운세 생성 실패 시 rollback용)
 */
async function restoreOneTimePurchase(uid: string, serviceType: ServiceType): Promise<void> {
  await db.collection('users').doc(uid).update({
    oneTimePurchases: admin.firestore.FieldValue.arrayUnion(serviceType)
  });
  console.log(`[AccessCheck] Restored one-time purchase for user ${uid}, service ${serviceType}`);
}

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
        creditBalance: user.creditBalance,
        currentSubscription: user.currentSubscription,
        oneTimePurchases: user.oneTimePurchases
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

    // 1. 접근 권한 확인 및 예약 (Transaction - race condition 방지)
    const accessType = await checkAndReserveOneTimePurchase(uid, 'today');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    // 2. 캐시 확인
    const cached = await fortuneService.getCached(uid, 'today', { name, birthDate });
    if (cached) {
      // 캐시 hit인 경우 일회성 구매 복원 (아직 사용 안한 것으로 간주)
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'today');
      }
      return {
        success: true,
        data: cached
      };
    }

    // 3. 새로운 운세 생성 (임시 paymentId)
    let result;
    try {
      result = await fortuneService.generateFortune(
        uid,
        'today',
        { name, birthDate },
        'temp_payment_id' // 실제로는 결제 시스템과 연동 필요
      );
    } catch (error) {
      // 운세 생성 실패 시 일회성 구매 복원
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'today');
      }
      throw error;
    }

    // 4. 성공 (일회성 구매는 이미 checkAndReserveOneTimePurchase에서 소진됨)
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
 * @param paymentId - PortOne V2 결제 ID (PortOne SDK 응답의 paymentId)
 * @param merchantUid - 가맹점 주문번호
 */
export const verifyPayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}, async (request) => {
  try {
    const { paymentId, merchantUid } = request.data;

    if (!paymentId || !merchantUid) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const result = await paymentService.verifyPayment({
      paymentId,
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
 * @param paymentId - PortOne V2 결제 ID (PortOne SDK 응답의 paymentId)
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

    const { paymentId, merchantUid } = request.data;

    if (!paymentId || !merchantUid) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const result = await paymentService.completePayment(paymentId, merchantUid);

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

    const accessType = await checkAndReserveOneTimePurchase(uid, 'saju');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'saju', { name, birthDate, birthTime });
    if (cached) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'saju');
      }
      return { success: true, data: cached };
    }

    let result;
    try {
      result = await fortuneService.generateFortune(
        uid, 'saju', { name, birthDate, birthTime }, 'temp_payment_id'
      );
    } catch (error) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'saju');
      }
      throw error;
    }

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

    const accessType = await checkAndReserveOneTimePurchase(uid, 'tojung');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'tojung', { name, birthDate, lunarCalendar });
    if (cached) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'tojung');
      }
      return { success: true, data: cached };
    }

    let result;
    try {
      result = await fortuneService.generateFortune(
        uid, 'tojung', { name, birthDate, lunarCalendar }, 'temp_payment_id'
      );
    } catch (error) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'tojung');
      }
      throw error;
    }

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

    const accessType = await checkAndReserveOneTimePurchase(uid, 'compatibility');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'compatibility',
      { name, birthDate, partnerName, partnerBirthDate });
    if (cached) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'compatibility');
      }
      return { success: true, data: cached };
    }

    let result;
    try {
      result = await fortuneService.generateFortune(
        uid, 'compatibility',
        { name, birthDate, partnerName, partnerBirthDate },
        'temp_payment_id'
      );
    } catch (error) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'compatibility');
      }
      throw error;
    }

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

    const accessType = await checkAndReserveOneTimePurchase(uid, 'wealth');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'wealth', { name, birthDate, jobType });
    if (cached) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'wealth');
      }
      return { success: true, data: cached };
    }

    let result;
    try {
      result = await fortuneService.generateFortune(
        uid, 'wealth', { name, birthDate, jobType }, 'temp_payment_id'
      );
    } catch (error) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'wealth');
      }
      throw error;
    }

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

    const accessType = await checkAndReserveOneTimePurchase(uid, 'love');
    if (accessType === 'none') {
      throw new AppError(ErrorCode.SVC001, '접근 권한이 없습니다. 결제가 필요합니다.');
    }

    const cached = await fortuneService.getCached(uid, 'love',
      { name, birthDate, gender, relationshipStatus });
    if (cached) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'love');
      }
      return { success: true, data: cached };
    }

    let result;
    try {
      result = await fortuneService.generateFortune(
        uid, 'love',
        { name, birthDate, gender, relationshipStatus },
        'temp_payment_id'
      );
    } catch (error) {
      if (accessType === 'oneTime') {
        await restoreOneTimePurchase(uid, 'love');
      }
      throw error;
    }

    return { success: true, data: result };
  } catch (error: any) {
    logError('generateLoveFortune', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * Standard Webhooks 기반 시그니처 검증
 * @param secret - Webhook secret
 * @param headers - HTTP 요청 헤더
 * @param body - 원본 body (string)
 * @returns 검증 성공 여부
 */
function verifyWebhookSignature(
  secret: string,
  headers: any,
  body: string
): boolean {
  const webhookId = headers['webhook-id'];
  const webhookTimestamp = headers['webhook-timestamp'];
  const webhookSignature = headers['webhook-signature'];

  console.log('[WebhookVerify] Headers:', {
    'webhook-id': webhookId,
    'webhook-timestamp': webhookTimestamp,
    'webhook-signature': webhookSignature ? webhookSignature.substring(0, 50) + '...' : undefined
  });

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error('[WebhookVerify] Missing required headers');
    return false;
  }

  // Signed content: {id}.{timestamp}.{body}
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  console.log('[WebhookVerify] Signed content length:', signedContent.length);
  console.log('[WebhookVerify] Body preview:', body.substring(0, 100));

  // HMAC SHA-256 계산
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64');

  console.log('[WebhookVerify] Expected signature:', expectedSignature);

  // Signature 형식: "v1,signature1 v1,signature2 ..."
  const signatures = webhookSignature.split(' ');
  console.log('[WebhookVerify] Received signatures:', signatures);

  for (const sig of signatures) {
    const [version, signature] = sig.split(',');
    console.log('[WebhookVerify] Checking signature:', { version, signature });
    if (version === 'v1' && signature === expectedSignature) {
      console.log('[WebhookVerify] ✓ Signature match!');
      return true;
    }
  }

  console.error('[WebhookVerify] ✗ Signature mismatch - none of the signatures matched');
  return false;
}

/**
 * PortOne V2 Webhook Endpoint
 * 결제 완료 알림을 받아 completePayment를 호출하는 백업 경로
 * 클라이언트가 결제 후 페이지를 닫아도 결제 완료 처리를 보장
 */
export const portoneWebhook = onRequest({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 100,
  cors: true,
  timeoutSeconds: 30
}, async (request, response) => {
  try {
    // POST 요청만 허용
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // 디버깅: 모든 헤더와 body 로깅
    console.log('[PortOneWebhook] === DEBUG START ===');
    console.log('[PortOneWebhook] All headers:', JSON.stringify(request.headers, null, 2));
    console.log('[PortOneWebhook] Content-Type:', request.headers['content-type']);
    console.log('[PortOneWebhook] Parsed body type:', typeof request.body);
    console.log('[PortOneWebhook] Parsed body:', JSON.stringify(request.body, null, 2));
    console.log('[PortOneWebhook] rawBody exists:', !!(request as any).rawBody);
    console.log('[PortOneWebhook] rawBody type:', typeof (request as any).rawBody);
    if ((request as any).rawBody) {
      console.log('[PortOneWebhook] rawBody length:', (request as any).rawBody.length);
      console.log('[PortOneWebhook] rawBody preview:', (request as any).rawBody.toString('utf-8').substring(0, 200));
    }
    console.log('[PortOneWebhook] === DEBUG END ===');

    // Webhook signature 검증
    const { PORTONE_WEBHOOK_SECRET } = await import('./config/environment');
    if (PORTONE_WEBHOOK_SECRET) {
      // rawBody 추출: Buffer -> string
      let rawBody: string;

      if ((request as any).rawBody && Buffer.isBuffer((request as any).rawBody)) {
        rawBody = (request as any).rawBody.toString('utf-8');
      } else {
        // rawBody가 Buffer가 아니면 JSON.stringify 사용 (fallback)
        rawBody = JSON.stringify(request.body);
        console.warn('[PortOneWebhook] rawBody is not a Buffer, using JSON.stringify as fallback');
      }

      const isValid = verifyWebhookSignature(
        PORTONE_WEBHOOK_SECRET,
        request.headers,
        rawBody
      );

      if (!isValid) {
        console.error('[PortOneWebhook] Signature verification failed');
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }
      console.log('[PortOneWebhook] Signature verified successfully');
    } else {
      console.warn('[PortOneWebhook] Webhook secret not set, skipping verification');
    }

    // Webhook body 파싱 (V2 형식만 지원)
    const webhookBody = request.body;
    console.log('[PortOneWebhook] Received webhook:', JSON.stringify(webhookBody));

    // Webhook 타입 확인 (V2: 2024-04-25 버전)
    if (!webhookBody || typeof webhookBody !== 'object') {
      console.error('[PortOneWebhook] Invalid webhook body');
      response.status(400).json({ error: 'Invalid webhook body' });
      return;
    }

    const { type, data } = webhookBody;

    if (!type || !data) {
      console.error('[PortOneWebhook] Missing type or data field - V2 format required');
      response.status(400).json({ error: 'V2 webhook format required' });
      return;
    }

    // Transaction.Paid 이벤트만 처리
    if (type === 'Transaction.Paid') {
      const { paymentId } = data;

      if (!paymentId) {
        console.error('[PortOneWebhook] Missing paymentId in webhook data');
        response.status(400).json({ error: 'Missing paymentId' });
        return;
      }

      console.log(`[PortOneWebhook] Processing Transaction.Paid for paymentId: ${paymentId}`);

      // merchantUid = paymentId (우리가 생성한 값)
      const merchantUid = paymentId;

      try {
        // 결제 완료 처리 (중복 처리는 completePayment 내부에서 방지)
        await paymentService.completePayment(paymentId, merchantUid);
        console.log(`[PortOneWebhook] Payment completed successfully: ${paymentId}`);
      } catch (error: any) {
        // 이미 처리된 결제인 경우 (PAY002 에러) 정상 응답
        if (error.code === ErrorCode.PAY002) {
          console.log(`[PortOneWebhook] Payment already completed: ${paymentId}`);
          response.status(200).json({ success: true, message: 'Already processed' });
          return;
        }
        throw error;
      }
    } else {
      // 다른 이벤트 타입은 무시 (로그만 남김)
      console.log(`[PortOneWebhook] Ignored event type: ${type}`);
    }

    // 성공 응답
    response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[PortOneWebhook] Error processing webhook:', error);
    logError('portoneWebhook', error, request.body);
    response.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 결제 완료 시 리퍼럴 크레딧 처리 (트리거)
 */
export const processReferralCredit = onDocumentUpdated({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 100,
  document: 'payments/{paymentId}'
}, async (event) => {
  try {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // status가 completed로 변경된 경우만 처리
    if (before?.status !== 'completed' && after?.status === 'completed') {
      const paymentId = event.params.paymentId;
      await referralService.processReferralCredit(paymentId);
    }
  } catch (error: any) {
    logError('processReferralCredit', error, event.params);
    // 트리거 에러는 로그만 남기고 넘어감
  }
});

/**
 * 리퍼럴 통계 조회
 */
export const getReferralStats = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 50
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const stats = await referralService.getReferralStats(uid);

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    logError('getReferralStats', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 출금 요청
 * @param amount - 출금 금액
 * @param bankAccount - 은행 계좌 정보
 */
export const requestWithdrawal = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 20
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { amount, bankAccount } = request.data;

    if (!amount || !bankAccount) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    const withdrawalId = await referralService.requestWithdrawal(uid, amount, bankAccount);

    return {
      success: true,
      data: { withdrawalId }
    };
  } catch (error: any) {
    logError('requestWithdrawal', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 출금 승인 (관리자)
 * @param withdrawalId - 출금 요청 ID
 * @param note - 처리 메모
 */
export const approveWithdrawal = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 10
}, async (request) => {
  try {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { withdrawalId, note } = request.data;

    if (!withdrawalId) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    await referralService.approveWithdrawal(withdrawalId, uid, note);

    return {
      success: true,
      message: '출금이 승인되었습니다.'
    };
  } catch (error: any) {
    logError('approveWithdrawal', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 사용자 목록 조회 (관리자)
 * @param memberGrade - 필터링할 회원 등급 (optional)
 * @param limit - 페이지 크기
 * @param startAfter - 마지막 UID (페이지네이션)
 */
export const getUsersList = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 20
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    const memberGradeFromClaims = request.auth?.token?.memberGrade as string | undefined;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { memberGrade, limit, startAfter } = request.data || {};

    const users = await adminService.getUsersList(uid, { memberGrade, limit, startAfter }, memberGradeFromClaims);

    return {
      success: true,
      data: users
    };
  } catch (error: any) {
    logError('getUsersList', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 사용자 등급 변경 (관리자)
 * @param targetUid - 대상 사용자 UID
 * @param newGrade - 새로운 회원 등급
 */
export const updateUserGrade = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 10
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    const memberGrade = request.auth?.token?.memberGrade as string | undefined;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { targetUid, newGrade } = request.data;

    if (!targetUid || !newGrade) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    await adminService.updateUserGrade(uid, targetUid, newGrade, memberGrade);

    return {
      success: true,
      message: '회원 등급이 변경되었습니다.'
    };
  } catch (error: any) {
    logError('updateUserGrade', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 서비스 통계 조회 (관리자)
 */
export const getAnalytics = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  concurrency: 5,
  timeoutSeconds: 120
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    const memberGrade = request.auth?.token?.memberGrade as string | undefined;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const analytics = await adminService.getAnalytics(uid, memberGrade);

    return {
      success: true,
      data: analytics
    };
  } catch (error: any) {
    logError('getAnalytics', error, request.data);
    throw toHttpsError(error);
  }
});

/**
 * 시스템 설정 업데이트 (관리자)
 * @param configType - 설정 타입
 * @param configData - 설정 데이터
 */
export const updateSystemConfig = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 10
}, async (request) => {
  try {
    const uid = request.auth?.uid;
    const memberGrade = request.auth?.token?.memberGrade as string | undefined;

    if (!uid) {
      throw new AppError(ErrorCode.AUTH001, '인증이 필요합니다.');
    }

    const { configType, configData } = request.data;

    if (!configType || !configData) {
      throw new AppError(ErrorCode.SVC002, '필수 입력값이 누락되었습니다.');
    }

    await adminService.updateSystemConfig(uid, configType, configData, memberGrade);

    return {
      success: true,
      message: '시스템 설정이 업데이트되었습니다.'
    };
  } catch (error: any) {
    logError('updateSystemConfig', error, request.data);
    throw toHttpsError(error);
  }
});
