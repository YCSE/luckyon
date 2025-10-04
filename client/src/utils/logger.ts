/**
 * 개발 환경에서만 동작하는 로거
 * 프로덕션에서는 민감한 정보 로깅을 방지
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    // 경고는 프로덕션에서도 표시
    console.warn(...args);
  },

  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 표시
    console.error(...args);
  },

  // 민감한 데이터를 포함할 수 있는 디버그 로그
  debug: (tag: string, data: any) => {
    if (isDev) {
      console.log(`[${tag}]`, data);
    }
  }
};
