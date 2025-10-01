/**
 * 날짜 유틸리티 함수
 * 한국 형식(yyyy년 m월 d일)으로 날짜 처리
 */

/**
 * Date 객체를 한국 형식 문자열로 변환
 * @param date - Date 객체
 * @returns 'yyyy년 m월 d일' 형식의 문자열
 */
export function formatKoreanDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

/**
 * YYYY-MM-DD 형식의 문자열을 한국 형식으로 변환
 * @param dateString - 'YYYY-MM-DD' 형식의 문자열
 * @returns 'yyyy년 m월 d일' 형식의 문자열
 */
export function formatKoreanDateFromString(dateString: string): string {
  const date = new Date(dateString);
  return formatKoreanDate(date);
}

/**
 * 한국 형식 문자열을 YYYY-MM-DD 형식으로 변환
 * @param koreanDate - 'yyyy년 m월 d일' 형식의 문자열
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function parseKoreanDate(koreanDate: string): string {
  const match = koreanDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);

  if (!match) {
    throw new Error('올바른 날짜 형식이 아닙니다. (예: 2024년 1월 1일)');
  }

  const year = match[1];
  const month = match[2].padStart(2, '0');
  const day = match[3].padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 * @param date - Date 객체
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 현재 날짜를 한국 형식으로 반환
 * @returns 'yyyy년 m월 d일' 형식의 문자열
 */
export function getTodayKorean(): string {
  return formatKoreanDate(new Date());
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function getTodayISO(): string {
  return formatISODate(new Date());
}

/**
 * 한국 형식 날짜 유효성 검사
 * @param koreanDate - 검사할 날짜 문자열
 * @returns 유효하면 true, 아니면 false
 */
export function isValidKoreanDate(koreanDate: string): boolean {
  try {
    const isoDate = parseKoreanDate(koreanDate);
    const date = new Date(isoDate);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
