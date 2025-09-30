/**
 * Fortune service-related type definitions
 */
import { Timestamp } from 'firebase-admin/firestore';
import { ServiceType } from '../config/constants';

export interface FortuneRequestData {
  // 공통 필드
  name: string;
  birthDate: string;  // YYYY-MM-DD

  // 사주팔자용
  birthTime?: string; // HH:MM

  // 토정비결용
  lunarCalendar?: boolean;

  // 궁합용
  partnerName?: string;
  partnerBirthDate?: string;

  // 연애운용
  gender?: 'male' | 'female';
  relationshipStatus?: 'single' | 'dating' | 'married' | 'divorced';

  // 재물운용
  jobType?: string;
}

export interface AIResponse {
  html: string;
  summary: string;
  luckyItems?: string[];
  advice?: string;
}

export interface PaymentInfo {
  paymentId: string;
  type: 'oneTime' | 'subscription' | 'free';
}

export interface FortuneResult {
  resultId: string;
  uid: string;
  serviceType: ServiceType;
  requestData: FortuneRequestData;
  aiResponse: AIResponse;
  paymentInfo: PaymentInfo;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface FortuneGenerateRequest {
  serviceType: ServiceType;
  inputData: FortuneRequestData;
}

export interface FortuneGenerateResponse {
  resultId: string;
  html: string;
  summary: string;
  luckyItems?: string[];
  advice?: string;
}