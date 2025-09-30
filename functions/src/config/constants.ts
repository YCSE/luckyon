/**
 * LuckyOn Firebase Functions Constants
 * 기술 기획서 및 FUNCTIONS.md를 기반으로 한 시스템 상수
 */

// 캐시 기간 (초 단위)
export const CACHE_DURATION = {
  TODAY: 21600,      // 6시간
  SAJU: 2592000,     // 30일
  TOJUNG: 31536000,  // 365일
  COMPATIBILITY: 604800,  // 7일
  WEALTH: 86400,     // 24시간
  LOVE: 86400        // 24시간
} as const;

// 회원 등급
export const MEMBER_GRADES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  REGULAR: 'regular',
  SPECIAL: 'special'
} as const;

export type MemberGrade = typeof MEMBER_GRADES[keyof typeof MEMBER_GRADES];

// 결제 상태
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// 구독 타입
export const SUBSCRIPTION_TYPES = {
  ONE_TIME: 'oneTime',
  ONE_DAY: '1day',
  SEVEN_DAYS: '7days',
  THIRTY_DAYS: '30days'
} as const;

export type SubscriptionType = typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES];

// 서비스 타입
export const SERVICE_TYPES = {
  TODAY: 'today',
  SAJU: 'saju',
  TOJUNG: 'tojung',
  COMPATIBILITY: 'compatibility',
  WEALTH: 'wealth',
  LOVE: 'love'
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

// 서비스별 가격 (원)
export const SERVICE_PRICES: Record<ServiceType, number> = {
  [SERVICE_TYPES.TODAY]: 3900,
  [SERVICE_TYPES.SAJU]: 9900,
  [SERVICE_TYPES.TOJUNG]: 7900,
  [SERVICE_TYPES.COMPATIBILITY]: 12900,
  [SERVICE_TYPES.WEALTH]: 5900,
  [SERVICE_TYPES.LOVE]: 6900
};

// 구독 상품 가격 (원)
export const SUBSCRIPTION_PRICES = {
  [SUBSCRIPTION_TYPES.ONE_DAY]: 9900,
  [SUBSCRIPTION_TYPES.SEVEN_DAYS]: 39000,
  [SUBSCRIPTION_TYPES.THIRTY_DAYS]: 99000
} as const;

// 리퍼럴 비율 (회원 등급별)
export const REFERRAL_RATES: Record<MemberGrade, number> = {
  [MEMBER_GRADES.ADMIN]: 0.7,      // 70%
  [MEMBER_GRADES.MEMBER]: 0,       // 0%
  [MEMBER_GRADES.REGULAR]: 0.5,    // 50%
  [MEMBER_GRADES.SPECIAL]: 0.7     // 70%
};

// 시스템 제한
export const SYSTEM_LIMITS = {
  MAX_REFERRAL_CODE_LENGTH: 8,
  MIN_WITHDRAWAL_AMOUNT: 10000,
  MAX_WITHDRAWAL_AMOUNT: 1000000,
  RATE_LIMIT_PER_MINUTE: 100,
  MAX_RETRY_ATTEMPTS: 3,
  PAYMENT_TIMEOUT_SECONDS: 300
} as const;

// merchantUid 접두사 및 형식
export const MERCHANT_UID_PREFIX = 'LUCKY';

// PG 제공사
export const PG_PROVIDER = 'KCP';

// Functions Region
export const FUNCTIONS_REGION = 'asia-northeast3';

// 에러 코드
export enum ErrorCode {
  // 인증 에러 (AUTH)
  AUTH001 = 'AUTH001', // 인증 토큰 없음
  AUTH002 = 'AUTH002', // 유효하지 않은 토큰
  AUTH003 = 'AUTH003', // 만료된 토큰
  AUTH004 = 'AUTH004', // 권한 없음

  // 결제 에러 (PAY)
  PAY001 = 'PAY001',  // 결제 검증 실패
  PAY002 = 'PAY002',  // 중복 결제
  PAY003 = 'PAY003',  // 결제 취소 실패
  PAY004 = 'PAY004',  // 환불 처리 실패

  // 서비스 에러 (SVC)
  SVC001 = 'SVC001',  // 접근 권한 없음
  SVC002 = 'SVC002',  // 필수 입력값 누락
  SVC003 = 'SVC003',  // 유효하지 않은 입력값
  SVC004 = 'SVC004',  // AI 생성 실패

  // 시스템 에러 (SYS)
  SYS001 = 'SYS001',  // 데이터베이스 오류
  SYS002 = 'SYS002',  // 외부 API 오류
  SYS003 = 'SYS003',  // 타임아웃
  SYS004 = 'SYS004'   // Rate Limit 초과
}

// 에러 메시지
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH001]: '인증 토큰이 필요합니다.',
  [ErrorCode.AUTH002]: '유효하지 않은 인증 토큰입니다.',
  [ErrorCode.AUTH003]: '인증 토큰이 만료되었습니다.',
  [ErrorCode.AUTH004]: '접근 권한이 없습니다.',

  [ErrorCode.PAY001]: '결제 검증에 실패했습니다.',
  [ErrorCode.PAY002]: '중복된 결제입니다.',
  [ErrorCode.PAY003]: '결제 취소에 실패했습니다.',
  [ErrorCode.PAY004]: '환불 처리에 실패했습니다.',

  [ErrorCode.SVC001]: '해당 서비스를 이용할 권한이 없습니다.',
  [ErrorCode.SVC002]: '필수 입력값이 누락되었습니다.',
  [ErrorCode.SVC003]: '입력값이 올바르지 않습니다.',
  [ErrorCode.SVC004]: 'AI 운세 생성에 실패했습니다.',

  [ErrorCode.SYS001]: '데이터베이스 오류가 발생했습니다.',
  [ErrorCode.SYS002]: '외부 API 호출에 실패했습니다.',
  [ErrorCode.SYS003]: '요청 시간이 초과되었습니다.',
  [ErrorCode.SYS004]: '요청 제한을 초과했습니다.'
};