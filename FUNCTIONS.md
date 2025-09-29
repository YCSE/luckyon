# LuckyOn Firebase Functions V2 정의서

이 문서는 LuckyOn 프로젝트의 모든 Firebase Functions V2 함수를 정의합니다. 이 문서가 함수 구현의 단일 진실의 원천(SSOT)입니다.

## 목차

1. [인증 관련 Functions](#1-인증-관련-functions)
2. [운세 생성 Functions](#2-운세-생성-functions)
3. [결제 관련 Functions](#3-결제-관련-functions)
4. [리퍼럴 관련 Functions](#4-리퍼럴-관련-functions)
5. [관리자 Functions](#5-관리자-functions)
6. [예약 작업 Functions](#6-예약-작업-functions)
7. [트리거 Functions](#7-트리거-functions)

---

## 1. 인증 관련 Functions

### authSignup

**타입**: `onCall`
**설명**: 신규 회원가입 처리

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '512MiB',
  maxInstances: 50,
  concurrency: 200
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✓ | 이메일 주소 |
| password | string | ✓ | 비밀번호 (최소 8자) |
| displayName | string | ✓ | 표시 이름 |
| phoneNumber | string | - | 전화번호 (010-XXXX-XXXX) |
| referralCode | string | - | 추천인 코드 (8자리) |

#### 반환값
```typescript
{
  uid: string;           // 생성된 사용자 UID
  referralCode: string;  // 생성된 8자리 레퍼럴 코드
}
```

---

### authLogin

**타입**: `onCall`
**설명**: 사용자 로그인

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '512MiB',
  concurrency: 200
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✓ | 이메일 주소 |
| password | string | ✓ | 비밀번호 |

#### 반환값
```typescript
{
  token: string;    // Firebase Auth 토큰
  user: {
    uid: string;
    email: string;
    displayName: string;
    memberGrade: string;
    referralCode: string;
  }
}
```

---

### authVerifyToken

**타입**: `onCall`
**설명**: 토큰 유효성 검증

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '256MiB',
  concurrency: 500
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| token | string | ✓ | Firebase Auth 토큰 |

#### 반환값
```typescript
{
  valid: boolean;   // 토큰 유효 여부
  uid?: string;     // 유효한 경우 사용자 UID
}
```

---

## 2. 운세 생성 Functions

### generateFortune

**타입**: `onCall`
**설명**: 통합 운세 생성 함수 (모든 운세 서비스 처리)

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '4GiB',
  cpu: 2,
  minInstances: 1,
  maxInstances: 20,
  concurrency: 50,
  timeoutSeconds: 60
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| serviceType | string | ✓ | 'today' \| 'saju' \| 'tojung' \| 'compatibility' \| 'wealth' \| 'love' |
| inputData | object | ✓ | 서비스별 입력 데이터 (아래 개별 서비스 참조) |

#### 반환값
```typescript
{
  resultId: string;    // 결과 ID
  html: string;        // HTML 형식 결과
  summary: string;     // 요약
  luckyItems?: string[];  // 행운 아이템 (선택)
  advice?: string;     // 조언 (선택)
}
```

---

### generateTodayFortune

**타입**: `onCall`
**설명**: 오늘의 운세 생성

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 100,
  cacheTime: 21600  // 6시간
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 이름 |
| birthDate | string | ✓ | 생년월일 (YYYY-MM-DD) |

---

### generateSajuAnalysis

**타입**: `onCall`
**설명**: 사주팔자 분석

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '4GiB',
  concurrency: 50,
  cacheTime: 2592000  // 30일
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 이름 |
| birthDate | string | ✓ | 생년월일 (YYYY-MM-DD) |
| birthTime | string | ✓ | 생시 (HH:MM) |

---

### generateTojungSecret

**타입**: `onCall`
**설명**: 토정비결 운세

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '3GiB',
  concurrency: 50,
  cacheTime: 31536000  // 365일
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 이름 |
| birthDate | string | ✓ | 생년월일 (YYYY-MM-DD) |
| lunarCalendar | boolean | ✓ | 음력 여부 |

---

### generateCompatibility

**타입**: `onCall`
**설명**: 궁합 분석

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '3GiB',
  concurrency: 50,
  cacheTime: 604800  // 7일
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 본인 이름 |
| birthDate | string | ✓ | 본인 생년월일 |
| partnerName | string | ✓ | 상대방 이름 |
| partnerBirthDate | string | ✓ | 상대방 생년월일 |

---

### generateWealthFortune

**타입**: `onCall`
**설명**: 재물운 분석

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80,
  cacheTime: 86400  // 24시간
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 이름 |
| birthDate | string | ✓ | 생년월일 |
| jobType | string | ✓ | 직업 유형 |

---

### generateLoveFortune

**타입**: `onCall`
**설명**: 연애운 분석

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80,
  cacheTime: 86400  // 24시간
}
```

#### 매개변수 (inputData)
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 이름 |
| birthDate | string | ✓ | 생년월일 |
| gender | string | ✓ | 성별 ('male' \| 'female') |
| relationshipStatus | string | ✓ | 연애 상태 ('single' \| 'dating' \| 'married' \| 'divorced') |

---

## 3. 결제 관련 Functions

### createPayment

**타입**: `onCall`
**설명**: 결제 생성

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| paymentType | string | ✓ | 'oneTime' \| 'subscription' |
| productType | string | ✓ | 상품 타입 (서비스명 또는 구독 기간) |
| amount | number | ✓ | 결제 금액 |

#### 반환값
```typescript
{
  merchantUid: string;   // LUCKY_YYYYMMDD_XXXXXX 형식
  paymentData: {
    paymentId: string;
    impCode: string;
    pgProvider: string;
    status: string;
  }
}
```

---

### verifyPayment

**타입**: `onCall`
**설명**: 결제 검증

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| impUid | string | ✓ | PortOne 결제 고유번호 |
| merchantUid | string | ✓ | 주문번호 |

#### 반환값
```typescript
{
  valid: boolean;    // 검증 성공 여부
  status: string;    // 결제 상태
}
```

---

### completePayment

**타입**: `onCall`
**설명**: 결제 완료 처리

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 80
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| paymentId | string | ✓ | 결제 ID |
| impUid | string | ✓ | PortOne 결제 고유번호 |

#### 반환값
```typescript
{
  success: boolean;
  subscription?: {
    type: string;
    expiresAt: string;
  }
}
```

---

### processRefund

**타입**: `onCall`
**설명**: 환불 처리

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 50
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| paymentId | string | ✓ | 결제 ID |
| reason | string | ✓ | 환불 사유 |

#### 반환값
```typescript
{
  success: boolean;
  refundId: string;
}
```

---

### paymentWebhook

**타입**: `onRequest`
**설명**: KCP IPN 웹훅 처리
**엔드포인트**: `/webhook/payment`

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '512MiB',
  maxInstances: 100,
  concurrency: 500
}
```

---

## 4. 리퍼럴 관련 Functions

### getReferralStats

**타입**: `onCall`
**설명**: 리퍼럴 통계 조회

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 100
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| uid | string | ✓ | 사용자 ID |

#### 반환값
```typescript
{
  totalReferred: number;      // 총 추천 인원
  activeReferred: number;     // 활성 추천 인원
  totalEarnings: number;      // 총 수익
  thisMonthEarnings: number;  // 이번 달 수익
  referralLink: string;       // 추천 링크
}
```

---

### processReferralCredit

**타입**: `onDocumentUpdated` (Firestore 트리거)
**설명**: 결제 완료 시 리퍼럴 크레딧 처리
**트리거**: `payments/{paymentId}` 문서 업데이트

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 100
}
```

#### 처리 로직
1. 결제 상태가 'completed'로 변경 확인
2. 구매자의 추천인 확인
3. 추천인 등급별 수익률 계산
   - member: 0%
   - regular: 50%
   - special: 70%
   - admin: 70%
4. 크레딧 지급

---

### requestWithdrawal

**타입**: `onCall`
**설명**: 출금 요청

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 50
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| amount | number | ✓ | 출금 금액 (최소 10,000원) |
| bankAccount | object | ✓ | 계좌 정보 |
| bankAccount.bankName | string | ✓ | 은행명 |
| bankAccount.accountNumber | string | ✓ | 계좌번호 |
| bankAccount.accountHolder | string | ✓ | 예금주명 |

#### 반환값
```typescript
{
  requestId: string;
  status: string;
}
```

---

### approveWithdrawal

**타입**: `onCall`
**설명**: 출금 승인 (관리자 전용)
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 20
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| requestId | string | ✓ | 출금 요청 ID |
| approved | boolean | ✓ | 승인 여부 |
| adminNote | string | - | 관리자 메모 |

#### 반환값
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 5. 관리자 Functions

### updateSystemConfig

**타입**: `onCall`
**설명**: 시스템 설정 업데이트
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 10
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| configType | string | ✓ | 'pricing' \| 'referral' \| 'service' |
| configData | object | ✓ | 설정 데이터 |

#### 반환값
```typescript
{
  success: boolean;
  updatedConfig: object;
}
```

---

### getUsersList

**타입**: `onCall`
**설명**: 사용자 목록 조회
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 20
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| page | number | ✓ | 페이지 번호 (1부터 시작) |
| limit | number | ✓ | 페이지당 항목 수 (최대 100) |
| filter | object | - | 필터 옵션 |
| filter.memberGrade | string | - | 회원 등급 필터 |
| filter.searchTerm | string | - | 검색어 (이메일, 이름) |

#### 반환값
```typescript
{
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

---

### updateUserGrade

**타입**: `onCall`
**설명**: 사용자 등급 변경
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  concurrency: 20
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| targetUid | string | ✓ | 대상 사용자 ID |
| newGrade | string | ✓ | 'member' \| 'regular' \| 'special' |
| reason | string | ✓ | 변경 사유 |

#### 반환값
```typescript
{
  success: boolean;
  previousGrade: string;
  newGrade: string;
}
```

---

### getAnalytics

**타입**: `onCall`
**설명**: 통계 데이터 조회
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 10
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| startDate | string | ✓ | 시작일 (YYYY-MM-DD) |
| endDate | string | ✓ | 종료일 (YYYY-MM-DD) |
| type | string | ✓ | 'revenue' \| 'users' \| 'services' |

#### 반환값
```typescript
{
  data: {
    [key: string]: number | object;
  };
  summary: {
    total: number;
    average: number;
    trend: string;
  };
}
```

---

### processWithdrawalBatch

**타입**: `onCall`
**설명**: 출금 요청 일괄 처리
**권한**: admin only

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  concurrency: 5
}
```

#### 매개변수
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| requestIds | string[] | ✓ | 출금 요청 ID 배열 |

#### 반환값
```typescript
{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{
    requestId: string;
    status: string;
    message?: string;
  }>;
}
```

---

## 6. 예약 작업 Functions

### cleanupExpiredSubscriptions

**타입**: `onSchedule`
**설명**: 만료된 구독 상태 업데이트
**스케줄**: 매일 00:00 (Asia/Seoul)

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  schedule: 'every day 00:00',
  timeZone: 'Asia/Seoul'
}
```

---

### cleanupOldCache

**타입**: `onSchedule`
**설명**: 만료된 캐시 데이터 삭제
**스케줄**: 매 6시간

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB',
  schedule: 'every 6 hours'
}
```

---

### dailyAnalyticsReport

**타입**: `onSchedule`
**설명**: 일일 통계 리포트 생성
**스케줄**: 매일 09:00 (Asia/Seoul)

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  schedule: 'every day 09:00',
  timeZone: 'Asia/Seoul'
}
```

---

### processScheduledWithdrawals

**타입**: `onSchedule`
**설명**: 승인된 출금 요청 처리
**스케줄**: 매주 월요일 10:00

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '2GiB',
  schedule: 'every monday 10:00',
  timeZone: 'Asia/Seoul'
}
```

---

## 7. 트리거 Functions

### onUserCreate

**타입**: `onCreate` (Firestore 트리거)
**설명**: 신규 사용자 생성 시 처리
**트리거**: `users/{userId}` 생성

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB'
}
```

#### 처리 내용
1. 8자리 레퍼럴 코드 생성
2. 추천인 연결 (referralCode 제공 시)
3. 환영 이메일 발송
4. 초기 통계 데이터 생성

---

### onPaymentComplete

**타입**: `onUpdate` (Firestore 트리거)
**설명**: 결제 완료 시 처리
**트리거**: `payments/{paymentId}` status='completed' 업데이트

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '1GiB'
}
```

#### 처리 내용
1. 구독 또는 일회성 접근권 활성화
2. 리퍼럴 크레딧 처리
3. 영수증 이메일 발송
4. 사용 통계 업데이트

---

### onSubscriptionExpire

**타입**: `onUpdate` (Firestore 트리거)
**설명**: 구독 만료 시 처리
**트리거**: `subscriptions/{subscriptionId}` 만료

#### 설정
```typescript
{
  region: 'asia-northeast3',
  memory: '512MiB'
}
```

#### 처리 내용
1. 사용자 currentSubscription 제거
2. 만료 알림 발송
3. 재구독 유도 메시지

---

## 함수 명명 규칙

### 일반 함수 (onCall)
- **인증**: auth + 동작 (authSignup, authLogin)
- **생성**: generate + 대상 (generateFortune, generateSajuAnalysis)
- **처리**: process + 대상 (processRefund, processReferralCredit)
- **조회**: get + 대상 (getReferralStats, getUsersList)
- **수정**: update + 대상 (updateSystemConfig, updateUserGrade)
- **요청**: request + 동작 (requestWithdrawal)
- **승인**: approve + 대상 (approveWithdrawal)

### 예약 작업 (onSchedule)
- cleanup + 대상 (cleanupExpiredSubscriptions)
- process + 대상 (processScheduledWithdrawals)
- 리포트: dailyAnalyticsReport

### 트리거 (onCreate/onUpdate/onDelete)
- on + 이벤트 + 대상 (onUserCreate, onPaymentComplete)

---

## 환경 변수

### Firebase Config (functions:config:set)
```bash
# Gemini API
gemini.api_key="your-api-key"

# PortOne
portone.imp_code="your-imp-code"
portone.api_secret="your-api-secret"

# System
system.region="asia-northeast3"
system.admin_email="admin@luckyon.com"
```

### 로컬 개발 (.env.local)
```env
GEMINI_API_KEY=your-api-key
PORTONE_IMP_CODE=your-imp-code
PORTONE_API_SECRET=your-api-secret
FUNCTIONS_REGION=asia-northeast3
```

---

## 상수 정의

### 캐시 기간 (초)
- `CACHE_DURATION_TODAY`: 21600 (6시간)
- `CACHE_DURATION_SAJU`: 2592000 (30일)
- `CACHE_DURATION_TOJUNG`: 31536000 (365일)
- `CACHE_DURATION_COMPATIBILITY`: 604800 (7일)
- `CACHE_DURATION_WEALTH`: 86400 (24시간)
- `CACHE_DURATION_LOVE`: 86400 (24시간)

### 시스템 제한
- `MAX_REFERRAL_CODE_LENGTH`: 8
- `MIN_WITHDRAWAL_AMOUNT`: 10000
- `MAX_WITHDRAWAL_AMOUNT`: 1000000
- `RATE_LIMIT_PER_MINUTE`: 100
- `MAX_RETRY_ATTEMPTS`: 3
- `PAYMENT_TIMEOUT_SECONDS`: 300

### merchantUid 형식
- 패턴: `LUCKY_YYYYMMDD_XXXXXX`
- 예시: `LUCKY_20250129_A3B5C7`

---

## 에러 코드 체계

### 인증 (AUTH)
- `AUTH001`: 인증 토큰 없음
- `AUTH002`: 유효하지 않은 토큰
- `AUTH003`: 만료된 토큰
- `AUTH004`: 권한 없음

### 결제 (PAY)
- `PAY001`: 결제 검증 실패
- `PAY002`: 중복 결제
- `PAY003`: 결제 취소 실패
- `PAY004`: 환불 처리 실패

### 서비스 (SVC)
- `SVC001`: 접근 권한 없음
- `SVC002`: 필수 입력값 누락
- `SVC003`: 유효하지 않은 입력값
- `SVC004`: AI 생성 실패

### 시스템 (SYS)
- `SYS001`: 데이터베이스 오류
- `SYS002`: 외부 API 오류
- `SYS003`: 타임아웃
- `SYS004`: Rate Limit 초과

---

## 주의사항

1. **모든 함수는 asia-northeast3 (서울) 리전에 배포**
2. **함수명과 매개변수는 이 문서의 정의를 정확히 따름**
3. **메모리와 CPU 할당은 명시된 값 사용**
4. **에러 코드는 정의된 체계 준수**
5. **merchantUid는 반드시 LUCKY_YYYYMMDD_XXXXXX 형식**

---

**버전**: 1.0.0
**최종 수정일**: 2025-01-29
**문서 상태**: 확정

이 문서는 LuckyOn 프로젝트의 모든 Firebase Functions 구현의 기준입니다.