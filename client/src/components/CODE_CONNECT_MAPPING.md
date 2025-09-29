# Figma to Code Connect Mapping

This document maps the Figma design nodes to React components for the LuckyOn project.

## Component Mapping

### Page: Login Page (접속_로그인)
- **Figma Node ID**: `85:96`
- **Component Path**: `client/src/pages/Auth/LoginPage.tsx`
- **Description**: Main login page with hero section, service showcase, and login form

### Organisms

#### Hero Section
- **Figma Node ID**: `85:130`
- **Component**: Part of LoginPage
- **Props**:
  - Background image
  - Title text
  - Subtitle text

#### Footer
- **Figma Node ID**: `106:87`
- **Component Path**: `client/src/components/organisms/Footer/Footer.tsx`
- **Props**: None (static content)

### Molecules

#### Fortune Service Card
- **Figma Node IDs**:
  - Today Fortune: `141:105`
  - Saju: `141:108`
  - Compatibility: `141:111`
  - Love: `141:114`
  - Wealth: `141:117`
  - Tojung: `141:120`
- **Component Path**: `client/src/components/molecules/FortuneServiceCard/FortuneServiceCard.tsx`
- **Props**:
  ```typescript
  {
    title: string;
    description: string;
    icon: string;
    color: string;
    onClick?: () => void;
  }
  ```

### Atoms

#### Button
- **Figma Node ID**: `85:313` (Login button)
- **Component Path**: `client/src/components/atoms/Button/Button.tsx`
- **Props**:
  ```typescript
  {
    variant?: 'primary' | 'secondary' | 'fortune' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    children: React.ReactNode;
  }
  ```

#### Input
- **Figma Node IDs**:
  - Email: `85:310`
  - Password: `85:311`
- **Component Path**: `client/src/components/atoms/Input/Input.tsx`
- **Props**:
  ```typescript
  {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    type?: string;
    placeholder?: string;
  }
  ```

#### Tab
- **Figma Node IDs**:
  - Login Tab: `85:329`
  - Signup Tab: `85:333`
- **Component**: Styled component within LoginPage
- **Props**: Active state boolean

## Design Token Mapping

### Colors
| Figma Variable | Token Path | Value |
|---------------|------------|--------|
| white | `tokens.colors.neutral[0]` | #FFFFFF |
| identity | `tokens.colors.primary[500]` | #E56030 |
| text_기본 | `tokens.colors.neutral[800]` | #333333 |
| text2 | `tokens.colors.neutral[600]` | #777777 |
| text3 | `tokens.colors.neutral[500]` | #AAAAAA |
| text4 | `tokens.colors.neutral[400]` | #BBBBBB |
| bg1 | `tokens.colors.neutral[50]` | #F8F8F8 |
| line2 | `tokens.colors.neutral[300]` | #DDDDDD |

### Typography
| Figma Style | Token Path | Properties |
|------------|------------|------------|
| H1 | `tokens.typography.styles.H1` | 65px, Bold, 80px line-height |
| H2 | `tokens.typography.styles.H2` | 45px, SemiBold, 60px line-height |
| H5 | `tokens.typography.styles.H5` | 25px, Bold, 35px line-height |
| H6 | `tokens.typography.styles.H6` | 25px, Medium, 40px line-height |
| btn1 | `tokens.typography.styles.btn1` | 18px, Bold, 100% line-height |
| tab | `tokens.typography.styles.tab` | 16px, SemiBold, 100% line-height |
| sub1 | `tokens.typography.styles.sub1` | 16px, Light, 25px line-height |
| sub2 | `tokens.typography.styles.sub2` | 14px, Light, 100% line-height |

## Component Variants

### Button Variants
- **Primary**: Orange background (#E56030), white text
- **Secondary**: White background, orange border and text
- **Fortune**: Gradient background with glow effect
- **Ghost**: Transparent background

### Input States
- **Default**: Gray bottom border (#CCCCCC)
- **Focus**: Orange bottom border (#E56030)
- **Error**: Red bottom border (#F44336)
- **Disabled**: Light gray background

## Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Animation Tokens
- Fast: 150ms
- Base: 300ms
- Slow: 500ms
- Easing: ease, ease-in-out

## Usage Example

```typescript
import { LoginPage } from '@/pages/Auth/LoginPage';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FortuneServiceCard } from '@/components/molecules/FortuneServiceCard';
import { Footer } from '@/components/organisms/Footer';

// Use components with Figma-mapped props
<Button
  variant="primary"
  size="large"
  data-node-id="85:313"
>
  로그인
</Button>

<Input
  placeholder="이메일"
  type="email"
  data-node-id="85:310"
/>
```

## Code Connect Configuration

To use with Figma's Code Connect feature:

1. Install the Code Connect plugin in Figma
2. Link components using the node IDs provided
3. Map props as specified in this document
4. Use the design tokens for consistent styling

## Notes

- All components include `data-node-id` attributes for traceability
- Components follow atomic design principles
- Styled-components are used for CSS-in-JS
- Design tokens are centralized for easy updates
- Korean language support is built-in with proper fonts