import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

const imgLogo = "/assets/images/logo.svg";

const FooterContainer = styled.footer`
  background-color: ${tokens.colors.neutral[50]};
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
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


export const Footer: React.FC<{ 'data-name'?: string; 'data-node-id'?: string }> = (props) => {
  return (
    <FooterContainer {...props}>
      <Logo data-name="logo" data-node-id="106:73">
        <img src={imgLogo} alt="LuckyOn Logo" />
      </Logo>
      <Copyright data-node-id="99:243">© KINDVIRAL. All Rights Reserved.</Copyright>
    </FooterContainer>
  );
};