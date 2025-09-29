# LuckyOn Client

React-based frontend application for the LuckyOn AI fortune-telling service platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── atoms/          # Basic building blocks (Button, Input, etc.)
│   │   ├── molecules/      # Composite components (FortuneServiceCard, etc.)
│   │   └── organisms/      # Complex components (Footer, Header, etc.)
│   ├── pages/              # Page components
│   │   └── Auth/          # Authentication pages (Login, Signup)
│   ├── design-system/      # Design tokens and system
│   │   └── tokens/        # Design tokens (colors, typography, etc.)
│   ├── styles/            # Global styles and theme
│   ├── services/          # API services (Firebase functions)
│   ├── store/             # State management (Redux)
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
```

## 🎨 Design System

### Component Architecture

We follow Atomic Design principles:
- **Atoms**: Button, Input, Icon, etc.
- **Molecules**: FortuneServiceCard, Tab, etc.
- **Organisms**: Footer, Header, Hero, etc.
- **Templates**: Page layouts
- **Pages**: Complete views

### Design Tokens

All design values are centralized in `src/design-system/tokens/`:
- Colors (primary, secondary, neutral, semantic)
- Typography (font families, sizes, weights)
- Spacing scale
- Shadows and animations
- Breakpoints for responsive design

### Figma Integration

Components are mapped to Figma designs with node IDs for Code Connect:
- See `src/components/CODE_CONNECT_MAPPING.md` for complete mapping
- All components include `data-node-id` attributes

## 🛠 Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Styled Components** - CSS-in-JS
- **React Router** - Routing
- **Redux Toolkit** - State management
- **Firebase SDK** - Backend integration
- **Framer Motion** - Animations

## 📱 Features

### Current Pages
- **Login Page** - User authentication with email/password
- **Fortune Service Cards** - 6 fortune services showcase

### Fortune Services
1. 오늘의 운세 (Today's Fortune)
2. 사주팔자 (Saju Analysis)
3. 토정비결 (Tojung Secret)
4. 궁합 (Compatibility)
5. 재물운 (Wealth Fortune)
6. 연애운 (Love Fortune)

## 🔧 Development

### Environment Setup

Create `.env.local` for development:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=dev-luckyon.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dev-luckyon
VITE_FIREBASE_STORAGE_BUCKET=dev-luckyon.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Path Aliases

Configured path aliases for cleaner imports:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@design-system/` → `src/design-system/`
- `@pages/` → `src/pages/`
- `@services/` → `src/services/`
- `@utils/` → `src/utils/`

## 🎯 Code Style

### Component Template

```typescript
import React from 'react';
import styled from 'styled-components';
import { tokens } from '@design-system/tokens';

interface ComponentProps {
  // Props definition
}

const StyledComponent = styled.div<ComponentProps>`
  /* Styles using design tokens */
`;

export const Component: React.FC<ComponentProps> = (props) => {
  return (
    <StyledComponent {...props}>
      {/* Component content */}
    </StyledComponent>
  );
};
```

### Korean Language Support

- Primary font: Pretendard (modern Korean sans-serif)
- Classical font: Nanum Myeongjo (for fortune content)
- Proper Korean text handling with `word-break: keep-all`

## 🚢 Deployment

### Build for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Firebase Hosting Deployment

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 📝 Next Steps

1. **Authentication Flow**
   - Complete signup page
   - Implement Firebase Auth integration
   - Add password reset functionality

2. **Fortune Services**
   - Create individual fortune service pages
   - Integrate with Firebase Functions
   - Implement payment flow

3. **User Dashboard**
   - Profile management
   - Fortune history
   - Subscription management

4. **Admin Panel**
   - User management
   - Analytics dashboard
   - System configuration

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Please contact the project maintainer for contribution guidelines.

---

For backend documentation, see [../CLAUDE.md](../CLAUDE.md) and [../FUNCTIONS.md](../FUNCTIONS.md)