/**
 * Error handling utilities
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { ErrorCode, ERROR_MESSAGES } from '../config/constants';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public statusCode: number = 500
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * AppError를 Firebase HttpsError로 변환
 */
export const toHttpsError = (error: Error): HttpsError => {
  if (error instanceof AppError) {
    // 에러 코드에 따른 HttpsError 코드 매핑
    const httpsErrorCode = getHttpsErrorCode(error.code);
    return new HttpsError(httpsErrorCode, error.message, {
      code: error.code
    });
  }

  // 알 수 없는 에러
  return new HttpsError('internal', error.message || '알 수 없는 오류가 발생했습니다.');
};

/**
 * AppError의 ErrorCode를 HttpsError 코드로 변환
 */
const getHttpsErrorCode = (code: ErrorCode): any => {
  if (code.startsWith('AUTH')) {
    if (code === ErrorCode.AUTH004) return 'permission-denied';
    return 'unauthenticated';
  }

  if (code.startsWith('PAY')) {
    return 'failed-precondition';
  }

  if (code.startsWith('SVC')) {
    if (code === ErrorCode.SVC001) return 'permission-denied';
    if (code === ErrorCode.SVC002 || code === ErrorCode.SVC003) return 'invalid-argument';
    return 'internal';
  }

  if (code.startsWith('SYS')) {
    if (code === ErrorCode.SYS003) return 'deadline-exceeded';
    if (code === ErrorCode.SYS004) return 'resource-exhausted';
    return 'internal';
  }

  return 'internal';
};

/**
 * 에러 로깅 헬퍼
 */
export const logError = (context: string, error: Error, additionalData?: any): void => {
  console.error(`[${context}]`, {
    message: error.message,
    stack: error.stack,
    code: error instanceof AppError ? error.code : undefined,
    ...additionalData
  });
};