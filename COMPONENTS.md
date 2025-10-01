# LuckyOn Frontend Components Guide

## 개요

LuckyOn 프론트엔드는 React + TypeScript + styled-components 기반으로 구축되었으며, Atomic Design 패턴을 따릅니다. 이 문서는 모든 프론트엔드 작업의 **단일 진실의 원천(SSOT)** 입니다.

## 기술 스택

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: styled-components
- **Routing**: React Router v6
- **State Management**: React Context API
- **Design System**: Custom tokens system
- **Build Tool**: Vite

## 프로젝트 구조

```
client/src/
├── assets/                      # 이미지, 폰트 등 정적 파일
├── components/
│   ├── atoms/                   # 기본 컴포넌트 (Button, Input 등)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── DateInput/
│   │   └── ...
│   ├── molecules/               # 조합 컴포넌트 (FortuneServiceCard 등)
│   ├── organisms/               # 복잡한 UI 조합 (Footer, PricingCard 등)
│   └── layout/                  # 레이아웃 컴포넌트 (Header, HamburgerMenu)
├── pages/                       # 페이지 컴포넌트
│   ├── Home/
│   │   └── HomePage.tsx
│   ├── Auth/
│   │   └── LoginPage.tsx
│   ├── Fortune/
│   │   ├── TodayFortunePage.tsx
│   │   ├── SajuPage.tsx
│   │   └── ...
│   └── Pricing/
├── contexts/                    # React Context (AuthContext 등)
├── services/                    # API 호출 로직 (api.ts)
├── config/                      # 설정 (firebase.ts)
├── design-system/               # 디자인 시스템
│   └── tokens/
│       ├── index.ts            # 통합 토큰 정의
│       └── figma-mapped.ts     # Figma 매핑 토큰
├── utils/                       # 유틸리티 함수
│   └── date.ts                 # 날짜 포맷팅 함수
└── styles/                      # 글로벌 스타일
```

## 디자인 시스템 (Design Tokens)

### 토큰 구조

모든 디자인 토큰은 `client/src/design-system/tokens/index.ts`에 정의되어 있습니다.

```typescript
import { tokens } from '../design-system/tokens';

// 사용 예시
const StyledComponent = styled.div`
  color: ${tokens.colors.primary[500]};
  font-family: ${tokens.typography.fontFamily.primary};
  padding: ${tokens.spacing[4]};
  border-radius: ${tokens.borderRadius.md};
`;
```

### 색상 (Colors)

#### Primary Colors (메인 브랜드 컬러 - 오렌지)
```typescript
tokens.colors.primary[500]  // #E56030 - 메인 브랜드 오렌지
tokens.colors.primary[50]   // #fef3e2 - 라이트 골드
tokens.colors.primary[900]  // #ed5703 - 딥 골드
```

#### Secondary Colors (보조 컬러 - 퍼플)
```typescript
tokens.colors.secondary[500]  // #802eff - 메인 퍼플 (신비로운 느낌)
```

#### Neutral Colors (회색조)
```typescript
tokens.colors.neutral[0]      // #FFFFFF - 흰색
tokens.colors.neutral[50]     // #F8F8F8 - 배경색 (bg1)
tokens.colors.neutral[300]    // #DDDDDD - 선 색상 (line2)
tokens.colors.neutral[500]    // #AAAAAA - 텍스트3
tokens.colors.neutral[600]    // #777777 - 텍스트2
tokens.colors.neutral[800]    // #333333 - 기본 텍스트
```

#### Semantic Colors (의미론적 색상)
```typescript
tokens.colors.semantic.success  // #4CAF50 - 성공
tokens.colors.semantic.warning  // #FF9800 - 경고
tokens.colors.semantic.error    // #F44336 - 에러
tokens.colors.semantic.info     // #2196F3 - 정보
```

#### Fortune Colors (운세 등급 색상)
```typescript
tokens.colors.fortune.excellent  // #4CAF50 - 대길
tokens.colors.fortune.good       // #8BC34A - 길
tokens.colors.fortune.normal     // #FFC107 - 보통
tokens.colors.fortune.caution    // #FF9800 - 주의
tokens.colors.fortune.bad        // #F44336 - 흉
```

### 타이포그래피 (Typography)

#### 폰트 패밀리
```typescript
tokens.typography.fontFamily.primary    // 'Pretendard' - 기본 폰트
tokens.typography.fontFamily.secondary  // 'Nanum Myeongjo' - 운세 콘텐츠용
tokens.typography.fontFamily.mono       // 'Noto Sans Mono' - 모노스페이스
```

#### 폰트 크기
```typescript
tokens.typography.fontSize.xs    // 12px
tokens.typography.fontSize.sm    // 14px
tokens.typography.fontSize.base  // 16px
tokens.typography.fontSize.lg    // 18px
tokens.typography.fontSize.xl    // 20px
tokens.typography.fontSize['2xl'] // 24px
tokens.typography.fontSize['3xl'] // 30px
tokens.typography.fontSize['4xl'] // 36px
tokens.typography.fontSize['5xl'] // 48px
tokens.typography.fontSize['6xl'] // 65px (H1)
```

#### 폰트 굵기
```typescript
tokens.typography.fontWeight.light      // 300
tokens.typography.fontWeight.regular    // 400
tokens.typography.fontWeight.medium     // 500
tokens.typography.fontWeight.semibold   // 600
tokens.typography.fontWeight.bold       // 700
tokens.typography.fontWeight.extrabold  // 800
```

### 간격 (Spacing)
```typescript
tokens.spacing[1]   // 4px
tokens.spacing[2]   // 8px
tokens.spacing[3]   // 12px
tokens.spacing[4]   // 16px
tokens.spacing[6]   // 24px
tokens.spacing[8]   // 32px
tokens.spacing[10]  // 40px
tokens.spacing[12]  // 48px
```

### 테두리 반경 (Border Radius)
```typescript
tokens.borderRadius.sm    // 4px
tokens.borderRadius.base  // 8px
tokens.borderRadius.md    // 12px
tokens.borderRadius.lg    // 16px
tokens.borderRadius.xl    // 24px
tokens.borderRadius.full  // 9999px (완전한 원)
```

### 그림자 (Shadows)
```typescript
tokens.shadows.sm    // 작은 그림자
tokens.shadows.base  // 기본 그림자
tokens.shadows.md    // 중간 그림자
tokens.shadows.lg    // 큰 그림자
tokens.shadows.glow  // 오렌지 글로우 효과
```

### 애니메이션 (Animation)
```typescript
// Duration
tokens.animation.duration.fast   // 150ms
tokens.animation.duration.base   // 300ms
tokens.animation.duration.slow   // 500ms

// Easing
tokens.animation.easing.ease       // ease
tokens.animation.easing.easeOut    // ease-out
tokens.animation.easing.bounce     // cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### 반응형 브레이크포인트 (Breakpoints)
```typescript
tokens.breakpoints.xs   // 320px
tokens.breakpoints.sm   // 640px
tokens.breakpoints.md   // 768px
tokens.breakpoints.lg   // 1024px
tokens.breakpoints.xl   // 1280px
```

## Atomic Design 패턴

### Atoms (원자)
가장 작은 단위의 컴포넌트. 더 이상 분해할 수 없는 기본 UI 요소.

**예시**: Button, Input, DateInput, Label, Icon

```typescript
// client/src/components/atoms/Button/Button.tsx
import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'fortune' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const StyledButton = styled.button<ButtonProps>`
  font-family: ${tokens.typography.fontFamily.primary};
  font-weight: ${tokens.typography.fontWeight.bold};
  border-radius: 100px;
  // ... 스타일링
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  return (
    <StyledButton variant={variant} size={size} fullWidth={fullWidth} {...props}>
      {children}
    </StyledButton>
  );
};
```

### Molecules (분자)
여러 Atoms를 조합한 컴포넌트. 하나의 기능을 수행하는 UI 그룹.

**예시**: FortuneServiceCard, SearchBox, FormField

```typescript
// FortuneServiceCard 예시
export const FortuneServiceCard: React.FC<Props> = ({ title, description, image }) => {
  return (
    <Card>
      <Image src={image} alt={title} />
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};
```

### Organisms (유기체)
Molecules와 Atoms를 조합한 복잡한 UI 섹션. 독립적으로 동작 가능.

**예시**: Header, Footer, HamburgerMenu, PricingCard

```typescript
// client/src/components/layout/Header.tsx
export const Header: React.FC<HeaderProps> = ({ onMenuClick, menuButtonRef }) => {
  const navigate = useNavigate();

  return (
    <Container>
      <LogoImage src={logoSvg} alt="Lucky On" onClick={() => navigate('/')} />
      <MenuButton ref={menuButtonRef} onClick={onMenuClick}>
        {/* 메뉴 아이콘 */}
      </MenuButton>
    </Container>
  );
};
```

### Pages (페이지)
Organisms, Molecules, Atoms를 조합한 전체 페이지.

**예시**: HomePage, LoginPage, TodayFortunePage

## 스타일링 가이드 (styled-components)

### 기본 규칙

1. **컴포넌트와 스타일 분리**
   - 스타일드 컴포넌트는 실제 컴포넌트 정의 위에 배치
   - 명확한 네이밍으로 가독성 향상

2. **Props로 동적 스타일링**
   - Transient props ($prefix) 사용하여 DOM 전달 방지
   - TypeScript 인터페이스로 타입 정의

```typescript
// ✅ 좋은 예시
const StyledButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? tokens.colors.primary[500] : '#transparent'};
`;

// ❌ 나쁜 예시 (DOM에 active prop 전달됨)
const StyledButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? tokens.colors.primary[500] : '#transparent'};
`;
```

3. **토큰 사용 강제**
   - 하드코딩된 색상/크기 금지
   - 모든 값은 tokens에서 가져오기

```typescript
// ✅ 좋은 예시
const Container = styled.div`
  color: ${tokens.colors.neutral[800]};
  padding: ${tokens.spacing[4]};
`;

// ❌ 나쁜 예시
const Container = styled.div`
  color: #333333;
  padding: 16px;
`;
```

4. **반응형 디자인**
   - 모바일 퍼스트 접근
   - 미디어 쿼리는 breakpoints 토큰 사용

```typescript
const Container = styled.div`
  width: 100%;

  @media (min-width: ${tokens.breakpoints.md}) {
    max-width: 768px;
  }
`;
```

### 네이밍 규칙

#### 스타일드 컴포넌트 네이밍
- PascalCase 사용
- 의미있는 이름 (Container, Wrapper, Title, Description 등)
- 접두사/접미사: Styled, Wrapper, Container, List, Item, Button, Input

```typescript
const PageWrapper = styled.div``;
const Container = styled.div``;
const ServiceList = styled.div``;
const ServiceCard = styled.div``;
const ServiceTitle = styled.h2``;
```

#### 컴포넌트 파일 구조
```
ComponentName/
├── ComponentName.tsx    # 메인 컴포넌트 파일
├── index.ts            # Export 파일
└── ComponentName.test.tsx  # 테스트 파일 (선택)
```

## 컴포넌트 작성 규칙

### 1. TypeScript 인터페이스 정의

```typescript
export interface ComponentProps {
  title: string;
  description?: string;  // 선택적 prop
  onClick: () => void;
  variant?: 'primary' | 'secondary';  // Union type
  children?: React.ReactNode;
}
```

### 2. Props 기본값 설정

```typescript
export const Component: React.FC<ComponentProps> = ({
  title,
  description,
  variant = 'primary',  // 기본값
  onClick,
  ...props
}) => {
  // 컴포넌트 로직
};
```

### 3. 이벤트 핸들러 네이밍
- handle + EventName 패턴
- 예: handleClick, handleSubmit, handleChange

```typescript
const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // 로직
};
```

### 4. State 관리
- useState는 컴포넌트 상단에 배치
- 의미있는 이름 사용

```typescript
const [isOpen, setIsOpen] = useState(false);
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

### 5. useEffect 사용
- 의존성 배열 명확히 명시
- cleanup 함수 작성

```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // 로직
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [dependency]);
```

## 페이지 구조 분석

### HomePage.tsx

**목적**: 6개 운세 서비스 선택 화면

**구조**:
```
PageWrapper (최외곽, 회색 배경)
└── Container (600px 고정폭, 흰색)
    ├── Header (로고 + 햄버거 메뉴)
    ├── HamburgerMenu (드롭다운 메뉴)
    └── ServiceList (운세 서비스 카드 목록)
        └── ServiceCard x 6 (각 운세 서비스)
```

**특징**:
- 모바일 중심 레이아웃 (600px 고정폭)
- 반응형: 1440px 이하에서 padding 제거
- 카드 호버 효과 (translateY, box-shadow)
- useRef로 메뉴 버튼 위치 추적

### LoginPage.tsx

**목적**: 로그인/회원가입 페이지

**구조**:
```
Container
├── HeroSection (그라데이션 배경, 히어로 이미지)
│   ├── HeroTitle
│   └── HeroSubtitle
├── ContentSection
│   ├── SectionTitle (서비스 소개)
│   ├── ServiceGrid (운세 서비스 카드 6개)
│   ├── Divider (구분선)
│   ├── SectionTitle (로그인 안내)
│   └── LoginSection
│       ├── TabContainer (로그인/회원가입 탭)
│       └── FormContainer (로그인 또는 회원가입 폼)
│           ├── ErrorMessage / SuccessMessage
│           ├── Input 필드들
│           ├── ForgotPasswordLink (비밀번호 찾기)
│           └── LoginButton
└── Footer
```

**특징**:
- 탭 전환 (로그인 ↔ 회원가입)
- 비밀번호 재설정 기능
- Firebase Auth 통합
- 에러 핸들링 및 메시지 표시

## API 호출 패턴

### services/api.ts 구조

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// 타입 정의
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  referralCode?: string;
}

// API 함수
export const authAPI = {
  signup: async (data: SignupData) => {
    const fn = httpsCallable(functions, 'authSignup');
    const result = await fn(data);
    return result.data;
  },

  login: async (data: LoginData) => {
    const fn = httpsCallable(functions, 'authLogin');
    const result = await fn(data);
    return result.data;
  }
};
```

### API 호출 사용 예시

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response: any = await fortuneAPI.today({ name, birthDate });

    if (response.success) {
      setResult(response.data);
    } else {
      setError('운세 생성에 실패했습니다.');
    }
  } catch (err: any) {
    console.error('Fortune generation error:', err);
    setError(err.message || '운세 생성 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};
```

## Context API 사용

### AuthContext 패턴

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 라우팅 구조

```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/fortune/today" element={<ProtectedRoute><TodayFortunePage /></ProtectedRoute>} />
    <Route path="/fortune/saju" element={<ProtectedRoute><SajuPage /></ProtectedRoute>} />
    {/* ... 기타 라우트 */}
  </Routes>
</BrowserRouter>
```

## 폼 처리 패턴

### 1. 상태 관리
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

### 2. 폼 제출
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // API 호출
    await api.submit({ email, password });
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. 입력 필드
```typescript
<Input
  type="email"
  placeholder="이메일"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  disabled={loading}
/>
```

## 날짜 처리

### 한국 날짜 형식 (yyyy년 m월 d일)

```typescript
import { formatKoreanDate, formatKoreanDateFromString, parseKoreanDate } from '../utils/date';

// Date 객체 → 한국 형식
const formatted = formatKoreanDate(new Date());  // "2024년 10월 2일"

// YYYY-MM-DD → 한국 형식
const formatted = formatKoreanDateFromString("2024-10-02");  // "2024년 10월 2일"

// 한국 형식 → YYYY-MM-DD
const iso = parseKoreanDate("2024년 10월 2일");  // "2024-10-02"
```

### DateInput 컴포넌트 사용

```typescript
<DateInput
  label="생년월일"
  value={birthDate}  // YYYY-MM-DD 형식
  onChange={setBirthDate}
  placeholder="예: 1990년 1월 1일"
  required
/>
```

## 접근성 (Accessibility)

### 1. 시맨틱 HTML 사용
```typescript
<button>버튼</button>  // div가 아닌 button 사용
<h1>제목</h1>          // div가 아닌 heading 사용
<label>라벨</label>    // span이 아닌 label 사용
```

### 2. ARIA 속성
```typescript
<button aria-label="메뉴 열기" onClick={handleOpen}>
  <MenuIcon />
</button>
```

### 3. 키보드 네비게이션
- Tab 키로 이동 가능
- Enter/Space로 버튼 클릭
- Esc로 모달 닫기

## 성능 최적화

### 1. React.memo 사용
```typescript
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // 렌더링 로직
});
```

### 2. useCallback
```typescript
const handleClick = useCallback(() => {
  // 핸들러 로직
}, [dependency]);
```

### 3. useMemo
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 4. 이미지 최적화
- WebP 포맷 사용
- Lazy loading 적용
- 적절한 크기로 리사이징

## 에러 처리

### 1. 에러 바운더리
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 2. Try-Catch 패턴
```typescript
try {
  await riskyOperation();
} catch (err: any) {
  if (err.code === 'auth/user-not-found') {
    setError('존재하지 않는 사용자입니다.');
  } else {
    setError(err.message || '오류가 발생했습니다.');
  }
}
```

## 테스트 가이드

### 컴포넌트 테스트 (선택사항)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 주의사항

### 절대 하지 말아야 할 것

1. **하드코딩된 스타일**
   ```typescript
   // ❌ 나쁜 예시
   const Div = styled.div`
     color: #333;
     padding: 16px;
   `;
   ```

2. **인라인 스타일**
   ```typescript
   // ❌ 나쁜 예시
   <div style={{ color: '#333', padding: '16px' }}>내용</div>
   ```

3. **any 타입 남발**
   ```typescript
   // ❌ 나쁜 예시
   const data: any = await api.fetch();
   ```

4. **직접 DOM 조작**
   ```typescript
   // ❌ 나쁜 예시
   document.getElementById('element').style.display = 'none';
   ```

### 권장사항

1. **토큰 시스템 사용**
2. **TypeScript 타입 명시**
3. **컴포넌트 재사용성 고려**
4. **접근성 준수**
5. **성능 최적화**
6. **에러 처리 철저히**
7. **테스트 작성 (가능하면)**

## 체크리스트

새로운 컴포넌트를 만들 때 확인할 사항:

- [ ] TypeScript 인터페이스 정의
- [ ] Props 기본값 설정
- [ ] 토큰 시스템 사용 (하드코딩 금지)
- [ ] 반응형 디자인 적용
- [ ] 접근성 고려 (ARIA, 시맨틱 HTML)
- [ ] 에러 처리 구현
- [ ] Loading 상태 표시
- [ ] 한국어 메시지 사용
- [ ] 날짜는 한국 형식 (yyyy년 m월 d일)
- [ ] Export 파일 (index.ts) 작성

## 참고 문서

- **프로젝트 전체 가이드**: [CLAUDE.md](./CLAUDE.md)
- **Functions 구현 가이드**: [functions/CLAUDE.md](./functions/CLAUDE.md)
- **Functions 정의 명세**: [FUNCTIONS.md](./FUNCTIONS.md)

---

**주의**: 이 문서는 프론트엔드 개발의 단일 진실의 원천입니다. 모든 컴포넌트 작업 시 이 가이드를 따라야 합니다.
