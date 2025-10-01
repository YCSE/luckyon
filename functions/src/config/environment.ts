/**
 * 환경변수 관리
 * Firebase Functions V2에서는 .env 파일을 직접 사용
 */

// 환경변수를 직접 export (defineString 대신 process.env 사용)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const PORTONE_IMP_CODE = process.env.PORTONE_IMP_CODE || '';
export const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || '';
export const FUNCTIONS_REGION = process.env.FUNCTIONS_REGION || 'asia-northeast3';

// 환경 변수 검증
export const validateEnvironment = (): boolean => {
  const required = [
    { name: 'GEMINI_API_KEY', value: GEMINI_API_KEY },
    { name: 'PORTONE_IMP_CODE', value: PORTONE_IMP_CODE },
    { name: 'PORTONE_API_SECRET', value: PORTONE_API_SECRET }
  ];

  const missing = required.filter(env => !env.value);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.map(e => e.name));
    return false;
  }

  return true;
};