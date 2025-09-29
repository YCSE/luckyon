# LuckyOn Firebase Functions V2 구현 가이드

## 개요

이 문서는 LuckyOn 프로젝트의 Firebase Functions V2 구현을 위한 상세 가이드입니다. 모든 함수 정의는 [../FUNCTIONS.md](../FUNCTIONS.md)를 참조하며, 이를 기반으로 정확한 구현을 진행합니다.

## 프로젝트 설정

### package.json

```json
{
  "name": "luckyon-functions",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "jest"
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@google/generative-ai": "^0.1.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0",
    "nanoid": "^5.0.0",
    "joi": "^17.11.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint": "^8.55.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.29.0",
    "firebase-functions-test": "^3.1.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3"
  }
}
```

### TypeScript 설정 (tsconfig.json)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "lib": ["es2017", "es2018", "es2019", "es2020"]
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

## 디렉토리 구조

```
functions/
├── src/
│   ├── index.ts              # Functions 진입점
│   ├── config/
│   │   ├── constants.ts      # 상수 정의
│   │   ├── firebase.ts       # Firebase Admin 초기화
│   │   └── environment.ts    # 환경변수 관리
│   ├── services/
│   │   ├── auth.service.ts   # 인증 서비스
│   │   ├── fortune.service.ts # 운세 생성 서비스
│   │   ├── payment.service.ts # 결제 서비스
│   │   ├── referral.service.ts # 리퍼럴 서비스
│   │   └── admin.service.ts  # 관리자 서비스
│   ├── utils/
│   │   ├── validators.ts     # 입력 검증
│   │   ├── errors.ts        # 에러 처리
│   │   ├── cache.ts         # 캐시 관리
│   │   └── helpers.ts       # 헬퍼 함수
│   ├── types/
│   │   ├── user.types.ts    # 사용자 타입
│   │   ├── payment.types.ts # 결제 타입
│   │   ├── fortune.types.ts # 운세 타입
│   │   └── index.ts         # 타입 export
│   └── prompts/
│       ├── today.prompt.ts   # 오늘의 운세 프롬프트
│       ├── saju.prompt.ts    # 사주팔자 프롬프트
│       ├── tojung.prompt.ts  # 토정비결 프롬프트
│       ├── compatibility.prompt.ts # 궁합 프롬프트
│       ├── wealth.prompt.ts  # 재물운 프롬프트
│       └── love.prompt.ts    # 연애운 프롬프트
├── lib/                       # 컴파일된 JS 파일
├── package.json
├── tsconfig.json
└── .env.local
```

## Firestore Collections

### users Collection

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  memberGrade: 'admin' | 'member' | 'regular' | 'special';
  referralCode: string;  // 8자리 영문+숫자
  referredBy?: string;   // 추천인 UID
  referredUsers: string[];
  creditBalance: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  currentSubscription?: {
    type: '1day' | '7days' | '30days';
    expiresAt: Timestamp;
  };
  serviceUsage: {
    [serviceType: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

### payments Collection

```typescript
interface Payment {
  paymentId: string;
  uid: string;
  merchantUid: string;  // LUCKY_YYYYMMDD_XXXXXX
  impUid: string;
  paymentType: 'oneTime' | 'subscription';
  productType: string;
  productName: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  pgProvider: 'KCP';
  referralCredit?: {
    referrerUid: string;
    creditAmount: number;
    percentage: number;
  };
  createdAt: Timestamp;
  completedAt?: Timestamp;
  refundedAt?: Timestamp;
}
```

### fortune_results Collection

```typescript
interface FortuneResult {
  resultId: string;
  uid: string;
  serviceType: 'today' | 'saju' | 'tojung' | 'compatibility' | 'wealth' | 'love';
  requestData: {
    name: string;
    birthDate: string;  // YYYY-MM-DD
    birthTime?: string; // HH:MM
    lunarCalendar?: boolean;
    partnerName?: string;
    partnerBirthDate?: string;
    gender?: 'male' | 'female';
    relationshipStatus?: 'single' | 'dating' | 'married' | 'divorced';
    jobType?: string;
  };
  aiResponse: {
    html: string;
    summary: string;
    luckyItems?: string[];
    advice?: string;
  };
  paymentInfo: {
    paymentId: string;
    type: 'oneTime' | 'subscription' | 'free';
  };
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

## 함수 구현

### 1. 인증 관련 Functions

#### authSignup 구현

참조: [../FUNCTIONS.md#authSignup](../FUNCTIONS.md#authsignup)

```typescript
// src/index.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authService } from './services/auth.service';

export const authSignup = onCall({
  region: 'asia-northeast3',
  memory: '512MiB',
  maxInstances: 50,
  concurrency: 200
}, async (request) => {
  const { email, password, displayName, phoneNumber, referralCode } = request.data;

  try {
    const result = await authService.signup({
      email,
      password,
      displayName,
      phoneNumber,
      referralCode
    });

    return result;
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});
```

#### authLogin 구현

참조: [../FUNCTIONS.md#authLogin](../FUNCTIONS.md#authlogin)

```typescript
export const authLogin = onCall({
  region: 'asia-northeast3',
  memory: '512MiB',
  concurrency: 200
}, async (request) => {
  const { email, password } = request.data;

  try {
    const result = await authService.login(email, password);
    return result;
  } catch (error) {
    throw new HttpsError('unauthenticated', error.message);
  }
});
```

### 2. 운세 생성 Functions

#### generateFortune 통합 함수

참조: [../FUNCTIONS.md#generateFortune](../FUNCTIONS.md#generatefortune)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateFortune = onCall({
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 1,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}, async (request) => {
  const { serviceType, inputData } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'AUTH001');
  }

  // 1. 접근 권한 확인
  const hasAccess = await fortuneService.checkAccess(uid, serviceType);
  if (!hasAccess) {
    throw new HttpsError('permission-denied', 'SVC001');
  }

  // 2. 캐시 확인
  const cached = await fortuneService.getCached(uid, serviceType, inputData);
  if (cached) {
    return cached;
  }

  // 3. Gemini AI 호출
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = fortuneService.getPrompt(serviceType, inputData);
  const result = await model.generateContent(prompt);

  // 4. 결과 저장
  const fortuneResult = await fortuneService.saveResult({
    uid,
    serviceType,
    inputData,
    aiResponse: result.response.text()
  });

  return fortuneResult;
});
```

### 3. 결제 관련 Functions

#### createPayment 구현

참조: [../FUNCTIONS.md#createPayment](../FUNCTIONS.md#createpayment)

```typescript
export const createPayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}, async (request) => {
  const { paymentType, productType, amount } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'AUTH001');
  }

  // merchantUid 생성: LUCKY_YYYYMMDD_XXXXXX
  const date = format(new Date(), 'yyyyMMdd');
  const random = nanoid(6).toUpperCase();
  const merchantUid = `LUCKY_${date}_${random}`;

  const payment = await paymentService.create({
    uid,
    merchantUid,
    paymentType,
    productType,
    amount,
    status: 'pending'
  });

  return {
    merchantUid,
    paymentData: payment
  };
});
```

#### verifyPayment 구현

참조: [../FUNCTIONS.md#verifyPayment](../FUNCTIONS.md#verifypayment)

```typescript
export const verifyPayment = onCall({
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}, async (request) => {
  const { impUid, merchantUid } = request.data;

  // PortOne API 호출하여 검증
  const verification = await portOneService.verify(impUid, merchantUid);

  return {
    valid: verification.valid,
    status: verification.status
  };
});
```

### 4. 리퍼럴 관련 Functions

#### processReferralCredit 구현 (트리거)

참조: [../FUNCTIONS.md#processReferralCredit](../FUNCTIONS.md#processreferralcredit)

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

export const processReferralCredit = onDocumentUpdated({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 100,
  document: 'payments/{paymentId}'
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // status가 completed로 변경된 경우만 처리
  if (before.status !== 'completed' && after.status === 'completed') {
    const payment = after as Payment;

    // 구매자의 추천인 확인
    const buyer = await userService.getUser(payment.uid);
    if (buyer.referredBy) {
      const referrer = await userService.getUser(buyer.referredBy);

      // 등급별 수익률 적용
      let percentage = 0;
      switch (referrer.memberGrade) {
        case 'regular': percentage = 0.5; break;  // 50%
        case 'special': percentage = 0.7; break;  // 70%
        case 'admin': percentage = 0.7; break;    // 70%
        default: percentage = 0; // member는 0%
      }

      if (percentage > 0) {
        const creditAmount = Math.floor(payment.amount * percentage);
        await referralService.addCredit({
          uid: referrer.uid,
          amount: creditAmount,
          type: 'earned',
          relatedPaymentId: payment.paymentId,
          relatedUserId: payment.uid
        });
      }
    }
  }
});
```

### 5. 관리자 Functions

#### updateSystemConfig 구현

참조: [../FUNCTIONS.md#updateSystemConfig](../FUNCTIONS.md#updatesystemconfig)

```typescript
export const updateSystemConfig = onCall({
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 10
}, async (request) => {
  const { configType, configData } = request.data;
  const uid = request.auth?.uid;

  // 관리자 권한 확인
  const user = await userService.getUser(uid);
  if (user.memberGrade !== 'admin') {
    throw new HttpsError('permission-denied', 'AUTH004');
  }

  await adminService.updateConfig(configType, configData, uid);

  return { success: true };
});
```

### 6. 예약 작업 Functions

#### cleanupExpiredSubscriptions 구현

참조: [../FUNCTIONS.md#cleanupExpiredSubscriptions](../FUNCTIONS.md#cleanupexpiredsubscriptions)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';

export const cleanupExpiredSubscriptions = onSchedule({
  region: 'asia-northeast3',
  memory: '2GiB',
  schedule: 'every day 00:00',
  timeZone: 'Asia/Seoul'
}, async (context) => {
  const now = new Date();

  // 만료된 구독 찾기
  const expiredSubs = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .where('expiryDate', '<=', now)
    .get();

  const batch = db.batch();
  expiredSubs.forEach(doc => {
    batch.update(doc.ref, { status: 'expired' });
  });

  await batch.commit();
  console.log(`Processed ${expiredSubs.size} expired subscriptions`);
});
```

## 상수 정의

### src/config/constants.ts

```typescript
// 캐시 기간 (초 단위)
export const CACHE_DURATION = {
  TODAY: 21600,      // 6시간
  SAJU: 2592000,     // 30일
  TOJUNG: 31536000,  // 365일
  COMPATIBILITY: 604800,  // 7일
  WEALTH: 86400,     // 24시간
  LOVE: 86400        // 24시간
};

// 회원 등급
export const MEMBER_GRADES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  REGULAR: 'regular',
  SPECIAL: 'special'
} as const;

// 결제 상태
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

// 서비스 가격
export const SERVICE_PRICES = {
  TODAY: 3900,
  SAJU: 9900,
  TOJUNG: 7900,
  COMPATIBILITY: 12900,
  WEALTH: 5900,
  LOVE: 6900
};

// 구독 가격
export const SUBSCRIPTION_PRICES = {
  '1day': 9900,
  '7days': 39000,
  '30days': 99000
};

// 리퍼럴 비율
export const REFERRAL_RATES = {
  [MEMBER_GRADES.MEMBER]: 0,
  [MEMBER_GRADES.REGULAR]: 0.5,
  [MEMBER_GRADES.SPECIAL]: 0.7,
  [MEMBER_GRADES.ADMIN]: 0.7
};
```

## 에러 코드 관리

### src/utils/errors.ts

```typescript
export enum ErrorCode {
  // 인증 에러
  AUTH001 = 'AUTH001', // 인증 토큰 없음
  AUTH002 = 'AUTH002', // 유효하지 않은 토큰
  AUTH003 = 'AUTH003', // 만료된 토큰
  AUTH004 = 'AUTH004', // 권한 없음

  // 결제 에러
  PAY001 = 'PAY001',  // 결제 검증 실패
  PAY002 = 'PAY002',  // 중복 결제
  PAY003 = 'PAY003',  // 결제 취소 실패
  PAY004 = 'PAY004',  // 환불 처리 실패

  // 서비스 에러
  SVC001 = 'SVC001',  // 접근 권한 없음
  SVC002 = 'SVC002',  // 필수 입력값 누락
  SVC003 = 'SVC003',  // 유효하지 않은 입력값
  SVC004 = 'SVC004',  // AI 생성 실패

  // 시스템 에러
  SYS001 = 'SYS001',  // 데이터베이스 오류
  SYS002 = 'SYS002',  // 외부 API 오류
  SYS003 = 'SYS003',  // 타임아웃
  SYS004 = 'SYS004'   // Rate Limit 초과
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

## 테스트 가이드

### 단위 테스트

```typescript
// src/services/__tests__/auth.service.test.ts
import { authService } from '../auth.service';

describe('AuthService', () => {
  describe('signup', () => {
    it('should create user with referral code', async () => {
      const result = await authService.signup({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      });

      expect(result.referralCode).toHaveLength(8);
      expect(result.uid).toBeDefined();
    });
  });
});
```

### 통합 테스트

```typescript
// test/integration/fortune.test.ts
import * as functions from 'firebase-functions-test';
import { generateFortune } from '../src/index';

const test = functions();

describe('Fortune Generation', () => {
  it('should generate today fortune', async () => {
    const wrapped = test.wrap(generateFortune);
    const result = await wrapped({
      serviceType: 'today',
      inputData: {
        name: '홍길동',
        birthDate: '1990-01-01'
      }
    }, {
      auth: { uid: 'testuser123' }
    });

    expect(result.html).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});
```

## 로컬 개발

### 에뮬레이터 실행

```bash
# Firebase 에뮬레이터 시작
firebase emulators:start --only functions,firestore,auth

# Functions만 실행
firebase emulators:start --only functions
```

### 환경변수 설정

```bash
# .env.local 파일
GEMINI_API_KEY=your-api-key
PORTONE_IMP_CODE=your-imp-code
PORTONE_API_SECRET=your-api-secret
```

### 디버깅

```typescript
// 로그 추가
import { logger } from 'firebase-functions/v2';

logger.info('Processing payment', { paymentId, amount });
logger.error('Payment failed', { error });
```

## 배포

### 개발 환경 배포

```bash
firebase use development
firebase deploy --only functions
```

### 특정 함수만 배포

```bash
firebase deploy --only functions:generateFortune,functions:createPayment
```

### 프로덕션 배포

```bash
firebase use production
firebase deploy --only functions
```

## 모니터링

### Firebase Console에서 확인
- Functions 로그: Firebase Console > Functions > Logs
- 성능 메트릭: Firebase Console > Functions > Dashboard
- 에러 추적: Firebase Console > Functions > Health

### 커스텀 로깅

```typescript
import { logger } from 'firebase-functions/v2';

// 구조화된 로깅
logger.info('Payment completed', {
  paymentId: payment.paymentId,
  amount: payment.amount,
  userId: payment.uid,
  timestamp: new Date().toISOString()
});
```

## 주의사항

1. **모든 함수 정의는 [../FUNCTIONS.md](../FUNCTIONS.md)를 단일 진실의 원천으로 사용**
2. **함수명, 매개변수, 반환값은 FUNCTIONS.md와 정확히 일치해야 함**
3. **Region은 반드시 asia-northeast3 (서울) 사용**
4. **메모리와 CPU 할당은 FUNCTIONS.md 명세 준수**
5. **에러 코드는 정의된 코드만 사용**

## 참고 문서

- [Firebase Functions V2 공식 문서](https://firebase.google.com/docs/functions)
- [Google Gemini AI API](https://ai.google.dev/)
- [PortOne 결제 연동 가이드](https://developers.portone.io/)

---

이 문서는 Firebase Functions 구현을 위한 가이드입니다. 모든 함수의 정확한 명세는 [../FUNCTIONS.md](../FUNCTIONS.md)를 참조하세요.