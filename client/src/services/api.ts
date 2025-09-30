/**
 * API Service
 * Firebase Functions 호출 래퍼
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// 타입 정의
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FortuneInputBase {
  name: string;
  birthDate: string; // YYYY-MM-DD
}

export interface SajuInput extends FortuneInputBase {
  birthTime: string; // HH:MM
}

export interface TojungInput extends FortuneInputBase {
  lunarCalendar: boolean;
}

export interface CompatibilityInput extends FortuneInputBase {
  partnerName: string;
  partnerBirthDate: string;
}

export interface WealthInput extends FortuneInputBase {
  jobType: string;
}

export interface LoveInput extends FortuneInputBase {
  gender: 'male' | 'female';
  relationshipStatus: 'single' | 'dating' | 'married' | 'divorced';
}

export interface PaymentData {
  paymentType: 'oneTime' | 'subscription';
  productType: string;
  amount: number;
}

// 인증 API
export const authAPI = {
  signup: async (data: SignupData) => {
    const fn = httpsCallable(functions, 'authSignup');
    const result = await fn(data);
    return result.data;
  },

  login: async (data: LoginData) => {
    const fn = httpsCallable(functions, 'authLogin');
    const result = await fn(data);
    return result.data;
  },

  verifyToken: async (idToken: string) => {
    const fn = httpsCallable(functions, 'authVerifyToken');
    const result = await fn({ idToken });
    return result.data;
  }
};

// 운세 API
export const fortuneAPI = {
  today: async (data: FortuneInputBase) => {
    const fn = httpsCallable(functions, 'generateTodayFortune');
    const result = await fn(data);
    return result.data;
  },

  saju: async (data: SajuInput) => {
    const fn = httpsCallable(functions, 'generateSajuAnalysis');
    const result = await fn(data);
    return result.data;
  },

  tojung: async (data: TojungInput) => {
    const fn = httpsCallable(functions, 'generateTojungSecret');
    const result = await fn(data);
    return result.data;
  },

  compatibility: async (data: CompatibilityInput) => {
    const fn = httpsCallable(functions, 'generateCompatibility');
    const result = await fn(data);
    return result.data;
  },

  wealth: async (data: WealthInput) => {
    const fn = httpsCallable(functions, 'generateWealthFortune');
    const result = await fn(data);
    return result.data;
  },

  love: async (data: LoveInput) => {
    const fn = httpsCallable(functions, 'generateLoveFortune');
    const result = await fn(data);
    return result.data;
  }
};

// 결제 API
export const paymentAPI = {
  create: async (data: PaymentData) => {
    const fn = httpsCallable(functions, 'createPayment');
    const result = await fn(data);
    return result.data;
  },

  verify: async (impUid: string, merchantUid: string) => {
    const fn = httpsCallable(functions, 'verifyPayment');
    const result = await fn({ impUid, merchantUid });
    return result.data;
  },

  complete: async (impUid: string, merchantUid: string) => {
    const fn = httpsCallable(functions, 'completePayment');
    const result = await fn({ impUid, merchantUid });
    return result.data;
  }
};