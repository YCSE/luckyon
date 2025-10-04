/**
 * Layout Component
 * Header + HamburgerMenu를 포함하는 전역 레이아웃
 * login 페이지를 제외한 모든 페이지에 적용
 */
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Header } from './Header';
import { HamburgerMenu } from './HamburgerMenu';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <PageWrapper>
      <Container>
        <Header onMenuClick={() => setMenuOpen(true)} menuButtonRef={menuButtonRef} />
        <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} menuButtonRef={menuButtonRef} />
        {children}
      </Container>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8f8f8;
  display: flex;
  justify-content: center;
  padding: 0 420px;

  @media (max-width: 1440px) {
    padding: 0;
  }
`;

const Container = styled.div`
  width: 600px;
  min-height: 100vh;
  background: #ffffff;
  position: relative;

  @media (max-width: 600px) {
    width: 100%;
  }
`;
