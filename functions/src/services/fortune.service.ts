/**
 * Fortune Service
 * 운세 생성 및 관리
 */
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/firebase';
import { AppError } from '../utils/errors';
import { ErrorCode, CACHE_DURATION, ServiceType } from '../config/constants';
import { generateFortuneId } from '../utils/helpers';
import { FortuneResult, FortuneRequestData, AIResponse } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { GEMINI_API_KEY } from '../config/environment';

export class FortuneService {
  private genAI?: GoogleGenerativeAI;

  private getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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

    // 2. 일회성 결제 확인 (결제 내역이 있는지 확인)
    // 여기서는 간단히 false 반환 (실제로는 복잡한 로직 필요)
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
      const model = this.getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

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
    // HTML 형식으로 반환된다고 가정
    // 실제로는 더 복잡한 파싱 로직 필요
    return {
      html: text,
      summary: this.extractSummary(text),
      luckyItems: this.extractLuckyItems(text),
      advice: this.extractAdvice(text)
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
    return `
당신은 전문 운세 전문가입니다. 다음 정보를 바탕으로 오늘의 운세를 작성해주세요.

**사용자 정보:**
- 이름: ${data.name}
- 생년월일: ${data.birthDate}
- 오늘 날짜: ${new Date().toISOString().split('T')[0]}

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
    `.trim();
  }

  /**
   * 사주팔자 프롬프트 (임시)
   */
  private getSajuPrompt(data: FortuneRequestData): string {
    return `사주팔자 운세: ${data.name}, ${data.birthDate}, ${data.birthTime}`;
  }

  /**
   * 토정비결 프롬프트 (임시)
   */
  private getTojungPrompt(data: FortuneRequestData): string {
    return `토정비결 운세: ${data.name}, ${data.birthDate}, 음력: ${data.lunarCalendar}`;
  }

  /**
   * 궁합 프롬프트 (임시)
   */
  private getCompatibilityPrompt(data: FortuneRequestData): string {
    return `궁합 운세: ${data.name}와 ${data.partnerName}`;
  }

  /**
   * 재물운 프롬프트 (임시)
   */
  private getWealthPrompt(data: FortuneRequestData): string {
    return `재물운: ${data.name}, ${data.jobType}`;
  }

  /**
   * 연애운 프롬프트 (임시)
   */
  private getLovePrompt(data: FortuneRequestData): string {
    return `연애운: ${data.name}, ${data.gender}, ${data.relationshipStatus}`;
  }
}

// Singleton instance
export const fortuneService = new FortuneService();