/**
 * Firebase Admin 초기화
 */
import * as admin from 'firebase-admin';

// Firebase Admin 초기화
admin.initializeApp();

// Firestore 인스턴스
export const db = admin.firestore();

// Auth 인스턴스
export const auth = admin.auth();

// Firestore 설정
db.settings({
  timestampsInSnapshots: true,
  ignoreUndefinedProperties: true
});

// 타임스탬프 헬퍼
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

export default admin;