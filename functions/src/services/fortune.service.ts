/**
 * Fortune Service
 * 운세 생성 및 관리
 */
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { db } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, CACHE_DURATION, ServiceType } from '../config/constants';
import { generateFortuneId, formatKoreanDate, formatKoreanDateFromString, formatKoreanTime } from '../utils/helpers';
import { FortuneResult, FortuneRequestData, AIResponse } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { GEMINI_API_KEY } from '../config/environment';

export class FortuneService {
  private genAI?: GoogleGenAI;

  private getGenAI(): GoogleGenAI {
    if (!this.genAI) {
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.genAI = new GoogleGenAI({
        apiKey: GEMINI_API_KEY
      });
    }
    return this.genAI;
  }

  /**
   * 사용자의 서비스 접근 권한 확인
   */
  async checkAccess(uid: string, serviceType: ServiceType): Promise<boolean> {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new AppError(ErrorCode.AUTH002, '사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();

    // 1. 구독 확인
    if (userData?.currentSubscription) {
      const expiresAt = userData.currentSubscription.expiresAt.toDate();
      const now = new Date();

      if (expiresAt > now) {
        return true; // 구독 활성 상태
      }
    }

    // 2. 일회성 결제 확인
    if (userData?.oneTimePurchases && Array.isArray(userData.oneTimePurchases)) {
      if (userData.oneTimePurchases.includes(serviceType)) {
        return true; // 일회성 구매로 접근 가능
      }
    }

    return false;
  }

  /**
   * 캐시된 운세 결과 조회
   */
  async getCached(
    uid: string,
    serviceType: ServiceType,
    inputData: FortuneRequestData
  ): Promise<any | null> {
    // 캐시 키 생성
    const cacheKey = this.generateCacheKey(serviceType, inputData);

    const cached = await db.collection('fortune_results')
      .where('uid', '==', uid)
      .where('serviceType', '==', serviceType)
      .where('cacheKey', '==', cacheKey)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (cached.empty) {
      return null;
    }

    const cachedDoc = cached.docs[0].data();
    const expiresAt = cachedDoc.expiresAt.toDate();
    const now = new Date();

    // 캐시 만료 확인
    if (expiresAt < now) {
      return null;
    }

    return {
      resultId: cachedDoc.resultId,
      html: cachedDoc.aiResponse.html,
      summary: cachedDoc.aiResponse.summary,
      luckyItems: cachedDoc.aiResponse.luckyItems,
      advice: cachedDoc.aiResponse.advice,
      cached: true
    };
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(serviceType: ServiceType, inputData: FortuneRequestData): string {
    const parts = [serviceType, inputData.name, inputData.birthDate];

    if (inputData.birthTime) parts.push(inputData.birthTime);
    if (inputData.partnerName) parts.push(inputData.partnerName);
    if (inputData.partnerBirthDate) parts.push(inputData.partnerBirthDate);
    if (inputData.gender) parts.push(inputData.gender);
    if (inputData.relationshipStatus) parts.push(inputData.relationshipStatus);
    if (inputData.jobType) parts.push(inputData.jobType);
    if (inputData.lunarCalendar !== undefined) parts.push(String(inputData.lunarCalendar));

    return parts.join('|');
  }

  /**
   * Gemini AI로 운세 생성
   */
  async generateFortune(
    uid: string,
    serviceType: ServiceType,
    inputData: FortuneRequestData,
    paymentId: string
  ): Promise<any> {
    try {
      // 1. 프롬프트 생성
      const prompt = this.getPrompt(serviceType, inputData);

      // 2. Gemini AI 호출
      const model = 'gemini-flash-latest';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await this.getGenAI().models.generateContentStream({
        model,
        contents,
      });

      let text = '';
      for await (const chunk of response) {
        text += chunk.text;
      }

      // 3. 응답 파싱
      const aiResponse = this.parseAIResponse(text);

      // 4. 결과 저장
      const fortuneResult = await this.saveResult({
        uid,
        serviceType,
        inputData,
        aiResponse,
        paymentId
      });

      return fortuneResult;
    } catch (error: any) {
      console.error('Fortune generation error:', error);
      throw new AppError(ErrorCode.SVC004, `AI 생성 실패: ${error.message}`);
    }
  }

  /**
   * AI 응답 파싱
   */
  private parseAIResponse(text: string): AIResponse {
    // 마크다운 코드 블록 제거 (```html ... ``` 또는 ``` ... ```)
    let cleanHtml = text.trim();

    // ```html 또는 ``` 로 시작하는 경우 제거
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.substring(7); // '```html' 제거
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.substring(3); // '```' 제거
    }

    // 끝의 ``` 제거
    if (cleanHtml.endsWith('```')) {
      cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
    }

    cleanHtml = cleanHtml.trim();

    // <style> 태그와 그 내용 완전히 제거
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // <script> 태그와 그 내용도 제거 (보안)
    cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    return {
      html: cleanHtml,
      summary: this.extractSummary(cleanHtml),
      luckyItems: this.extractLuckyItems(cleanHtml),
      advice: this.extractAdvice(cleanHtml)
    };
  }

  private extractSummary(text: string): string {
    // 간단한 요약 추출 (첫 200자)
    return text.substring(0, 200).replace(/<[^>]*>/g, '');
  }

  private extractLuckyItems(text: string): string[] {
    // 행운 아이템 추출 로직
    // 실제로는 AI 응답에서 특정 섹션 파싱 필요
    return [];
  }

  private extractAdvice(text: string): string {
    // 조언 추출 로직
    return '';
  }

  /**
   * 운세 결과 저장
   */
  private async saveResult(data: {
    uid: string;
    serviceType: ServiceType;
    inputData: FortuneRequestData;
    aiResponse: AIResponse;
    paymentId: string;
  }): Promise<any> {
    const resultId = generateFortuneId();
    const now = Timestamp.now();

    // 캐시 기간 설정
    const cacheDuration = CACHE_DURATION[data.serviceType.toUpperCase() as keyof typeof CACHE_DURATION];
    const expiresAt = Timestamp.fromMillis(Date.now() + cacheDuration * 1000);

    const fortuneResult: FortuneResult = {
      resultId,
      uid: data.uid,
      serviceType: data.serviceType,
      requestData: data.inputData,
      aiResponse: data.aiResponse,
      paymentInfo: {
        paymentId: data.paymentId,
        type: 'oneTime' // 실제로는 결제 타입에 따라 결정
      },
      createdAt: now,
      expiresAt
    };

    await db.collection('fortune_results').doc(resultId).set({
      ...fortuneResult,
      cacheKey: this.generateCacheKey(data.serviceType, data.inputData)
    });

    // 사용자의 serviceUsage 업데이트
    await db.collection('users').doc(data.uid).update({
      [`serviceUsage.${data.serviceType}`]: admin.firestore.FieldValue.increment(1),
      updatedAt: now
    });

    return {
      resultId,
      html: data.aiResponse.html,
      summary: data.aiResponse.summary,
      luckyItems: data.aiResponse.luckyItems,
      advice: data.aiResponse.advice
    };
  }

  /**
   * 서비스 타입별 프롬프트 생성
   */
  private getPrompt(serviceType: ServiceType, inputData: FortuneRequestData): string {
    switch (serviceType) {
      case 'today':
        return this.getTodayPrompt(inputData);
      case 'saju':
        return this.getSajuPrompt(inputData);
      case 'tojung':
        return this.getTojungPrompt(inputData);
      case 'compatibility':
        return this.getCompatibilityPrompt(inputData);
      case 'wealth':
        return this.getWealthPrompt(inputData);
      case 'love':
        return this.getLovePrompt(inputData);
      default:
        throw new AppError(ErrorCode.SVC003, '유효하지 않은 서비스 타입입니다.');
    }
  }

  /**
   * 오늘의 운세 프롬프트
   */
  private getTodayPrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const todayKorean = formatKoreanDate(new Date());

    return `
당신은 전문 운세 전문가입니다. 다음 정보를 바탕으로 오늘의 운세를 작성해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}
- 오늘 날짜: ${todayKorean}

**작성 가이드:**
1. 전체 운세 (종합운)
2. 사랑운
3. 재물운
4. 건강운
5. 행운의 아이템 (색상, 숫자, 방향)
6. 오늘의 조언

**출력 형식:**
HTML 형식으로 작성하되, 따뜻하고 긍정적인 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
중요: <style>, <script> 태그는 절대 사용하지 마세요. 오직 HTML 태그만 사용하세요.
    `.trim();
  }

  /**
   * 사주팔자 프롬프트
   */
  private getSajuPrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const birthTimeKorean = data.birthTime ? formatKoreanTime(data.birthTime) : '';

    return `
당신은 전문 사주팔자 전문가입니다. 다음 정보를 바탕으로 사주팔자를 분석해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}
- 생시: ${birthTimeKorean}

**작성 가이드:**
1. 사주팔자 구성 (천간, 지지)
2. 오행 분석
3. 성격 및 기질
4. 직업 및 재물운
5. 건강운
6. 인간관계
7. 조언 및 주의사항

**출력 형식:**
HTML 형식으로 작성하되, 전문적이고 상세한 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
    `.trim();
  }

  /**
   * 토정비결 프롬프트
   */
  private getTojungPrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const currentYear = new Date().getFullYear();

    return `
당신은 토정비결 전문가입니다. 다음 정보를 바탕으로 ${currentYear}년 한 해의 운세를 작성해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}
- 달력 종류: ${data.lunarCalendar ? '음력' : '양력'}

**작성 가이드:**
1. 연간 총운
2. 월별 운세 (12개월)
3. 사업운
4. 재물운
5. 건강운
6. 가정운
7. 조언

**출력 형식:**
HTML 형식으로 작성하되, 전통적이면서도 이해하기 쉬운 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
    `.trim();
  }

  /**
   * 궁합 프롬프트
   */
  private getCompatibilityPrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const partnerBirthDateKorean = data.partnerBirthDate
      ? formatKoreanDateFromString(data.partnerBirthDate)
      : '';

    return `
당신은 궁합 전문가입니다. 다음 두 사람의 궁합을 분석해주세요.

**본인 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}

**상대방 정보:**
- 이름: ${data.partnerName}
- 생년월일: ${partnerBirthDateKorean}

**작성 가이드:**
1. 전체 궁합 점수 및 평가
2. 성격 궁합
3. 연애 궁합
4. 결혼 궁합
5. 금전 궁합
6. 주의할 점
7. 조언

**출력 형식:**
HTML 형식으로 작성하되, 따뜻하고 긍정적인 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
중요: <style>, <script> 태그는 절대 사용하지 마세요. 오직 HTML 태그만 사용하세요.
    `.trim();
  }

  /**
   * 재물운 프롬프트
   */
  private getWealthPrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const todayKorean = formatKoreanDate(new Date());

    return `
당신은 재물운 전문가입니다. 다음 정보를 바탕으로 재물운을 분석해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}
- 직업: ${data.jobType}
- 오늘 날짜: ${todayKorean}

**작성 가이드:**
1. 전체 재물운
2. 수입운
3. 투자운
4. 사업운
5. 행운의 재물 방향
6. 주의사항
7. 오늘의 조언

**출력 형식:**
HTML 형식으로 작성하되, 실용적이고 현실적인 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
    `.trim();
  }

  /**
   * 연애운 프롬프트
   */
  private getLovePrompt(data: FortuneRequestData): string {
    const birthDateKorean = formatKoreanDateFromString(data.birthDate);
    const todayKorean = formatKoreanDate(new Date());

    const genderText = data.gender === 'male' ? '남성' : '여성';
    let statusText = '';
    switch (data.relationshipStatus) {
      case 'single': statusText = '싱글'; break;
      case 'dating': statusText = '연애 중'; break;
      case 'married': statusText = '기혼'; break;
      case 'divorced': statusText = '이혼'; break;
    }

    return `
당신은 연애운 전문가입니다. 다음 정보를 바탕으로 연애운을 분석해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${birthDateKorean}
- 성별: ${genderText}
- 현재 상태: ${statusText}
- 오늘 날짜: ${todayKorean}

**작성 가이드:**
1. 전체 연애운
2. 만남의 운
3. 이상형 분석
4. 현재 관계 조언 (해당되는 경우)
5. 주의사항
6. 행운의 장소/시간
7. 오늘의 조언

**출력 형식:**
HTML 형식으로 작성하되, 따뜻하고 로맨틱한 톤으로 작성해주세요.
각 섹션은 <section> 태그로 구분하고, 제목은 <h2> 태그를 사용하세요.
    `.trim();
  }
}

// Singleton instance
export const fortuneService = new FortuneService();