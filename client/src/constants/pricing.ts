/**
 * Pricing Constants
 * 가격 및 서비스 상수 중앙 관리
 */

// 서비스별 일회성 가격
export const SERVICE_PRICES = {
  today: 3900,      // 오늘의 운세
  saju: 9900,       // 사주팔자
  tojung: 7900,     // 토정비결
  compatibility: 12900, // 궁합
  wealth: 5900,     // 재물운
  love: 6900        // 연애운
} as const;

// 구독 가격
export const SUBSCRIPTION_PRICES = {
  '1day': 9900,     // 1일 이용권
  '7days': 39000,   // 7일 이용권 (약 44% 할인)
  '30days': 99000   // 30일 이용권 (약 67% 할인)
} as const;

// 서비스 이름 매핑
export const SERVICE_NAMES = {
  today: '오늘의 운세',
  saju: '사주팔자',
  tojung: '토정비결',
  compatibility: '궁합',
  wealth: '재물운',
  love: '연애운'
} as const;

// 서비스 설명
export const SERVICE_DESCRIPTIONS = {
  today: '당일 운세를 확인하세요',
  saju: '평생 사주를 분석합니다',
  tojung: '한 해의 운세를 봅니다',
  compatibility: '두 사람의 궁합을 봅니다',
  wealth: '금전 운세를 봅니다',
  love: '연애 운세를 봅니다'
} as const;

// 서비스 특징
export const SERVICE_FEATURES = {
  today: ['6시간 캐시', '종합운/사랑운/재물운/건강운'],
  saju: ['생시 기반 정밀 분석', '사주 해석'],
  tojung: ['연간 운세', '월별 운세'],
  compatibility: ['사랑 궁합', '결혼 궁합'],
  wealth: ['직업별 맞춤 분석', '투자운'],
  love: ['상태별 맞춤 분석', '이상형 분석']
} as const;

// 구독 플랜 설명
export const SUBSCRIPTION_PLANS = [
  {
    title: '1일 이용권',
    price: SUBSCRIPTION_PRICES['1day'],
    description: '24시간 모든 서비스 무제한 이용',
    features: ['모든 운세 서비스 무제한', '24시간 이용', '영구 보관'],
    productType: '1day'
  },
  {
    title: '7일 이용권',
    price: SUBSCRIPTION_PRICES['7days'],
    description: '7일간 모든 서비스 무제한 이용',
    features: ['모든 운세 서비스 무제한', '7일간 이용', '영구 보관', '약 44% 할인'],
    productType: '7days',
    recommended: true
  },
  {
    title: '30일 이용권',
    price: SUBSCRIPTION_PRICES['30days'],
    description: '한 달간 모든 서비스 무제한 이용',
    features: ['모든 운세 서비스 무제한', '30일간 이용', '영구 보관', '약 67% 할인'],
    productType: '30days'
  }
] as const;

// 일회성 구매 플랜
export const ONE_TIME_PLANS = [
  {
    title: SERVICE_NAMES.today,
    price: SERVICE_PRICES.today,
    description: SERVICE_DESCRIPTIONS.today,
    features: SERVICE_FEATURES.today,
    productType: 'today'
  },
  {
    title: SERVICE_NAMES.saju,
    price: SERVICE_PRICES.saju,
    description: SERVICE_DESCRIPTIONS.saju,
    features: SERVICE_FEATURES.saju,
    productType: 'saju'
  },
  {
    title: SERVICE_NAMES.tojung,
    price: SERVICE_PRICES.tojung,
    description: SERVICE_DESCRIPTIONS.tojung,
    features: SERVICE_FEATURES.tojung,
    productType: 'tojung'
  },
  {
    title: SERVICE_NAMES.compatibility,
    price: SERVICE_PRICES.compatibility,
    description: SERVICE_DESCRIPTIONS.compatibility,
    features: SERVICE_FEATURES.compatibility,
    productType: 'compatibility'
  },
  {
    title: SERVICE_NAMES.wealth,
    price: SERVICE_PRICES.wealth,
    description: SERVICE_DESCRIPTIONS.wealth,
    features: SERVICE_FEATURES.wealth,
    productType: 'wealth'
  },
  {
    title: SERVICE_NAMES.love,
    price: SERVICE_PRICES.love,
    description: SERVICE_DESCRIPTIONS.love,
    features: SERVICE_FEATURES.love,
    productType: 'love'
  }
] as const;

// 타입 정의
export type ServiceType = keyof typeof SERVICE_PRICES;
export type SubscriptionType = keyof typeof SUBSCRIPTION_PRICES;
export type PaymentType = 'oneTime' | 'subscription';