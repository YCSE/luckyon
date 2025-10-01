/**
 * Helper utility functions
 */
import { nanoid, customAlphabet } from 'nanoid';
import { format } from 'date-fns';
import { MERCHANT_UID_PREFIX, SYSTEM_LIMITS } from '../config/constants';

/**
 * 8자리 레퍼럴 코드 생성 (영문 대문자 + 숫자)
 */
export const generateReferralCode = (): string => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generate = customAlphabet(alphabet, SYSTEM_LIMITS.MAX_REFERRAL_CODE_LENGTH);
  return generate();
};

/**
 * merchantUid 생성: LUCKY_YYYYMMDD_XXXXXX
 */
export const generateMerchantUid = (): string => {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const random = nanoid(6).toUpperCase();
  return `${MERCHANT_UID_PREFIX}_${dateStr}_${random}`;
};

/**
 * 결제 ID 생성
 */
export const generatePaymentId = (): string => {
  return `pay_${nanoid(16)}`;
};

/**
 * 운세 결과 ID 생성
 */
export const generateFortuneId = (): string => {
  return `fortune_${nanoid(16)}`;
};

/**
 * 크레딧 ID 생성
 */
export const generateCreditId = (): string => {
  return `credit_${nanoid(16)}`;
};

/**
 * 출금 요청 ID 생성
 */
export const generateWithdrawalId = (): string => {
  return `withdrawal_${nanoid(16)}`;
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 날짜를 한국 형식으로 변환 (yyyy년 m월 d일)
 */
export const formatKoreanDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * YYYY-MM-DD 형식의 문자열을 한국 형식으로 변환
 */
export const formatKoreanDateFromString = (dateString: string): string => {
  const date = new Date(dateString);
  return formatKoreanDate(date);
};

/**
 * 시간을 HH:MM 형식으로 변환
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * 시간을 한국 형식으로 변환 (오전/오후 h시 m분)
 */
export const formatKoreanTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours % 12 || 12;
  return `${period} ${displayHours}시 ${minutes}분`;
};

/**
 * 금액을 천 단위 구분자로 포맷팅
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

/**
 * 문자열을 안전하게 트림
 */
export const safeTrim = (str: string | undefined | null): string => {
  return (str || '').trim();
};

/**
 * 이메일 마스킹 (개인정보 보호)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
};

/**
 * 전화번호 마스킹 (개인정보 보호)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
};

/**
 * 계좌번호 마스킹 (개인정보 보호)
 */
export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) {
    return '*'.repeat(accountNumber.length);
  }
  const lastFour = accountNumber.slice(-4);
  const masked = '*'.repeat(accountNumber.length - 4);
  return masked + lastFour;
};

/**
 * 지정된 시간(초) 후의 Date 객체 반환
 */
export const getExpiryDate = (seconds: number): Date => {
  return new Date(Date.now() + seconds * 1000);
};

/**
 * 두 날짜 간의 일수 계산
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 객체에서 undefined 값 제거
 */
export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};