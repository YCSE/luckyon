/**
 * 환경변수 관리
 */
import { defineString } from 'firebase-functions/params';

// Gemini API Key
export const GEMINI_API_KEY = defineString('GEMINI_API_KEY', {
  description: 'Google Gemini AI API Key',
  default: process.env.GEMINI_API_KEY || ''
});

// PortOne 설정
export const PORTONE_IMP_CODE = defineString('PORTONE_IMP_CODE', {
  description: 'PortOne IMP Code',
  default: process.env.PORTONE_IMP_CODE || ''
});

export const PORTONE_API_SECRET = defineString('PORTONE_API_SECRET', {
  description: 'PortOne API Secret',
  default: process.env.PORTONE_API_SECRET || ''
});

// 시스템 설정
export const FUNCTIONS_REGION = defineString('FUNCTIONS_REGION', {
  description: 'Firebase Functions Region',
  default: 'asia-northeast3'
});

// 환경 변수 검증
export const validateEnvironment = (): boolean => {
  const required = [
    { name: 'GEMINI_API_KEY', value: GEMINI_API_KEY.value() },
    { name: 'PORTONE_IMP_CODE', value: PORTONE_IMP_CODE.value() },
    { name: 'PORTONE_API_SECRET', value: PORTONE_API_SECRET.value() }
  ];

  const missing = required.filter(env => !env.value);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.map(e => e.name));
    return false;
  }

  return true;
};