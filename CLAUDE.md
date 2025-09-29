# LuckyOn - AI 운세 서비스 플랫폼

## 프로젝트 개요

LuckyOn은 Google Gemini AI를 활용한 종합 운세 서비스 플랫폼입니다. Firebase Functions V2 기반의 100% 서버리스 아키텍처로 구축되며, 6가지 운세 서비스와 리퍼럴 시스템을 제공합니다.

### 핵심 기능
- **6개 운세 서비스**: 오늘의 운세, 사주팔자, 토정비결, 궁합, 재물운, 연애운
- **결제 시스템**: 일회성 결제 + 기간제 구독 (1일/7일/30일)
- **회원 등급**: admin, member, regular, special
- **리퍼럴 시스템**: 등급별 차등 수익률 (회원 0%, 정회원 50%, 특별회원 70%)

## 프로젝트 구조

```
luckyon/
├── CLAUDE.md                 # 프로젝트 전체 가이드 (현재 문서)
├── FUNCTIONS.md              # 모든 Firebase Functions 정의 (SSOT)
├── .env.local               # 로컬 환경변수
├── .env.production          # 프로덕션 환경변수
├── firebase.json            # Firebase 설정
├── firestore.rules          # Firestore 보안 규칙
├── firestore.indexes.json   # Firestore 인덱스 정의
├── functions/               # Firebase Functions
│   ├── CLAUDE.md           # Functions 구현 가이드
│   ├── package.json        # Functions 의존성
│   ├── tsconfig.json       # TypeScript 설정
│   ├── .env.local         # Functions 로컬 환경변수
│   ├── .env.production    # Functions 프로덕션 환경변수
│   └── src/
│       ├── index.ts       # Functions 진입점
│       ├── config/        # 설정 관리
│       ├── services/      # 비즈니스 로직
│       ├── utils/         # 유틸리티 함수
│       ├── types/         # TypeScript 타입 정의
│       └── prompts/       # AI 프롬프트 템플릿
├── client/                  # React 클라이언트
│   ├── package.json
│   ├── src/
│   └── public/
└── docs/                    # 추가 문서
```

## Firebase 프로젝트 설정

### 1. Firebase 프로젝트 생성

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init
```

선택 옵션:
- Firestore
- Functions (TypeScript)
- Hosting
- Emulators

### 2. 프로젝트 ID 설정

각 환경별 프로젝트 ID:
- **Development**: `dev-luckyon`
- **Staging**: `staging-luckyon`
- **Production**: `luckyon`

```bash
# 프로젝트 별칭 설정
firebase use --add dev-luckyon --alias development
firebase use --add staging-luckyon --alias staging
firebase use --add luckyon --alias production
```

### 3. 환경변수 설정

`.env.local` (개발 환경):
```env
# Firebase Config
FIREBASE_PROJECT_ID=dev-luckyon
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=dev-luckyon.firebaseapp.com
FIREBASE_STORAGE_BUCKET=dev-luckyon.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# External APIs
GEMINI_API_KEY=your-gemini-api-key
PORTONE_IMP_CODE=your-portone-imp-code
PORTONE_API_SECRET=your-portone-api-secret

# Functions Region
FUNCTIONS_REGION=asia-northeast3
```

### 4. Functions 환경변수 설정

```bash
# Functions 환경변수 설정 (프로덕션)
firebase functions:config:set \
  gemini.api_key="your-gemini-api-key" \
  portone.imp_code="your-portone-imp-code" \
  portone.api_secret="your-portone-api-secret" \
  system.region="asia-northeast3"
```

## 개발 환경 구성

### 1. 의존성 설치

```bash
# 프로젝트 루트
npm install

# Functions 의존성
cd functions
npm install
```

### 2. 로컬 에뮬레이터 실행

```bash
# Firebase 에뮬레이터 시작
firebase emulators:start

# 특정 서비스만 실행
firebase emulators:start --only functions,firestore
```

에뮬레이터 포트:
- Firestore: 8080
- Functions: 5001
- Auth: 9099
- Hosting: 5000
- UI: 4000

### 3. TypeScript 컴파일

```bash
cd functions
npm run build       # TypeScript 컴파일
npm run watch      # 변경 감지 모드
```

## Firestore 컬렉션 스키마

주요 컬렉션:
- `users`: 사용자 정보 및 등급
- `payments`: 결제 내역
- `fortune_results`: 운세 결과 캐시
- `subscriptions`: 구독 정보
- `referral_credits`: 리퍼럴 크레딧
- `withdrawal_requests`: 출금 요청
- `system_config`: 시스템 설정

상세 스키마는 [functions/CLAUDE.md](./functions/CLAUDE.md#firestore-collections) 참조

## Firebase Functions 구현

모든 Functions는 V2로 구현되며, 상세 정의는 [FUNCTIONS.md](./FUNCTIONS.md)를 참조합니다.

### 함수 카테고리
1. **인증 관련**: authSignup, authLogin, authVerifyToken
2. **운세 생성**: generateFortune, generateTodayFortune 등 7개
3. **결제 관련**: createPayment, verifyPayment, completePayment 등
4. **리퍼럴 관련**: getReferralStats, processReferralCredit 등
5. **관리자**: updateSystemConfig, getUsersList, updateUserGrade 등
6. **예약 작업**: cleanupExpiredSubscriptions, dailyAnalyticsReport 등
7. **트리거**: onUserCreate, onPaymentComplete, onSubscriptionExpire

구현 가이드는 [functions/CLAUDE.md](./functions/CLAUDE.md) 참조

## 배포 프로세스

### 1. 개발 환경 테스트

```bash
# 로컬 테스트
npm run test

# Functions 테스트
cd functions
npm run test
```

### 2. 스테이징 배포

```bash
# 스테이징 환경 선택
firebase use staging

# Functions 배포
firebase deploy --only functions

# 전체 배포
firebase deploy
```

### 3. 프로덕션 배포

```bash
# 프로덕션 환경 선택
firebase use production

# 프로덕션 배포 (Blue-Green)
firebase deploy --only functions:generateFortune
firebase deploy --only functions
```

### 4. 롤백

```bash
# Functions 버전 확인
firebase functions:log

# 이전 버전으로 롤백
firebase functions:delete functionName
firebase deploy --only functions:functionName
```

## 보안 설정

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users: 본인 데이터만 읽기
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Functions만 쓰기 가능
    }

    // payments: Functions만 접근
    match /payments/{document=**} {
      allow read, write: if false;
    }

    // fortune_results: 본인 데이터만 읽기
    match /fortune_results/{resultId} {
      allow read: if request.auth != null &&
        request.auth.uid == resource.data.uid;
      allow write: if false;
    }

    // system_config: 인증된 사용자 읽기, admin만 쓰기
    match /system_config/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.memberGrade == 'admin';
    }
  }
}
```

## 모니터링

### 1. Firebase Console 모니터링
- Functions 로그: Firebase Console > Functions > Logs
- Firestore 사용량: Firebase Console > Firestore > Usage
- 성능 모니터링: Firebase Console > Performance

### 2. 커스텀 모니터링
- 에러율 추적
- 응답시간 측정
- 일일 통계 리포트

## 개발 우선순위

### Phase 1 (2주) - 기반 구축
- [ ] Firebase 프로젝트 설정
- [ ] 인증 시스템 (authSignup, authLogin, authVerifyToken)
- [ ] 오늘의 운세 서비스 (generateTodayFortune)
- [ ] 기간제 결제 시스템

### Phase 2 (2주) - 서비스 확장
- [ ] 5개 추가 운세 서비스 구현
- [ ] 일회성 결제 시스템
- [ ] 회원 등급 시스템

### Phase 3 (1주) - 수익화 기능
- [ ] 리퍼럴 시스템
- [ ] 크레딧 및 출금 기능
- [ ] 관리자 대시보드

### Phase 4 (1주) - 마무리
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 프로덕션 배포

## 참고 문서

- **Functions 구현 가이드**: [functions/CLAUDE.md](./functions/CLAUDE.md)
- **Functions 정의 명세**: [FUNCTIONS.md](./FUNCTIONS.md)
- **기술 기획서**: 프로젝트 문서 참조

## 문제 해결

### Functions 배포 실패
```bash
# 로그 확인
firebase functions:log --only functionName

# 환경변수 확인
firebase functions:config:get
```

### Firestore 권한 오류
- Security Rules 확인
- 인증 토큰 유효성 확인
- 사용자 등급 확인

### 외부 API 연동 실패
- API 키 환경변수 확인
- Rate Limit 확인
- 네트워크 타임아웃 설정

## 연락처

프로젝트 관련 문의사항은 프로젝트 매니저에게 연락 바랍니다.

---

**주의**: 이 문서는 프로젝트 전체 개요를 제공합니다. 구체적인 구현은 하위 문서들을 참조하세요.
- Functions 구현: [functions/CLAUDE.md](./functions/CLAUDE.md)
- Functions 정의: [FUNCTIONS.md](./FUNCTIONS.md)