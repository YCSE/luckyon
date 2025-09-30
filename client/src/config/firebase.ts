/**
 * Firebase Configuration
 * Firebase SDK 초기화 및 설정
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase 설정 (환경변수에서 로드)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화
export const auth = getAuth(app);

// Functions 초기화 (asia-northeast3 region)
export const functions = getFunctions(app, 'asia-northeast3');

// Firestore 초기화
export const db = getFirestore(app);

// 개발 환경에서 에뮬레이터 연결
if (import.meta.env.DEV) {
  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

  if (useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Firebase Emulators connected');
  }
}

export default app;