import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

const imgLogo = '/assets/images/logo.svg';

const FooterContainer = styled.footer`
  background-color: ${tokens.colors.neutral[50]};
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${tokens.colors.neutral[200]};
`;

const Logo = styled.div`
  width: 102px;
  height: 20px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Copyright = styled.p`
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #BBBBBB;
  text-align: center;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.5px;
`;

const Links = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const FooterLink = styled.a`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 14px;
  font-weight: ${tokens.typography.fontWeight.light};
  color: ${tokens.colors.neutral[600]};
  text-decoration: none;
  transition: color ${tokens.animation.duration.fast} ${tokens.animation.easing.ease};

  &:hover {
    color: ${tokens.colors.primary[500]};
  }
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <Logo>
        <img src={imgLogo} alt="LuckyOn Logo" />
      </Logo>
      <Copyright>© LUCKYON. All Rights Reserved.</Copyright>
      <Links>
        <FooterLink href="/terms">이용약관</FooterLink>
        <FooterLink href="/privacy">개인정보처리방침</FooterLink>
        <FooterLink href="/contact">문의하기</FooterLink>
      </Links>
    </FooterContainer>
  );
};