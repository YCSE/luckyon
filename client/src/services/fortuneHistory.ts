/**
 * Fortune History Service
 * Firestore에서 직접 운세 기록 조회
 */
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FortuneResult {
  resultId: string;
  uid: string;
  serviceType: 'today' | 'saju' | 'tojung' | 'compatibility' | 'wealth' | 'love';
  requestData: {
    name: string;
    birthDate: string;
    birthTime?: string;
    lunarCalendar?: boolean;
    partnerName?: string;
    partnerBirthDate?: string;
    gender?: 'male' | 'female';
    relationshipStatus?: 'single' | 'dating' | 'married' | 'divorced';
    jobType?: string;
  };
  aiResponse: {
    html: string;
    summary?: string;
    luckyItems?: string[];
    advice?: string;
  };
  paymentInfo: {
    paymentId: string;
    type: 'oneTime' | 'subscription' | 'free';
  };
  createdAt: Date;
  expiresAt: Date;
}

/**
 * 사용자의 운세 기록 조회
 */
export const getFortuneHistory = async (uid: string): Promise<FortuneResult[]> => {
  try {
    const fortuneResultsRef = collection(db, 'fortune_results');
    const q = query(
      fortuneResultsRef,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const results: FortuneResult[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        resultId: doc.id,
        uid: data.uid,
        serviceType: data.serviceType,
        requestData: data.requestData,
        aiResponse: data.aiResponse,
        paymentInfo: data.paymentInfo,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate()
      });
    });

    return results;
  } catch (error) {
    console.error('Error fetching fortune history:', error);
    throw error;
  }
};

/**
 * 운세 타입 한글 이름 매핑
 */
export const getFortuneTypeName = (serviceType: string): string => {
  const typeNames: { [key: string]: string } = {
    today: '오늘의 운세',
    saju: '사주팔자',
    tojung: '토정비결',
    compatibility: '궁합',
    wealth: '재물운',
    love: '연애운'
  };
  return typeNames[serviceType] || serviceType;
};

/**
 * 운세 타입 이모지 매핑
 */
export const getFortuneTypeEmoji = (serviceType: string): string => {
  const typeEmojis: { [key: string]: string } = {
    today: '🌟',
    saju: '🎋',
    tojung: '☀️',
    compatibility: '💑',
    wealth: '💰',
    love: '💖'
  };
  return typeEmojis[serviceType] || '🔮';
};
