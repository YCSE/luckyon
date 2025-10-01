/**
 * Header Component
 * 로고 + 3-dot 메뉴 버튼
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logoSvg from '../../assets/4d4a7262ea9220cd8d8d47c4f1a3f41b866f4c3f.svg';
import dotSvg from '../../assets/d8f91114e90eb2ee7a139759134ce2400850a8b9.svg';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <Container>
      <LogoImage src={logoSvg} alt="Lucky On" onClick={() => navigate('/')} />
      <MenuButton onClick={onMenuClick}>
        <Dot src={dotSvg} alt="" />
        <Dot src={dotSvg} alt="" />
        <Dot src={dotSvg} alt="" />
      </MenuButton>
    </Container>
  );
};

const Container = styled.header`
  position: relative;
  height: 60px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoImage = styled.img`
  height: 20px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const MenuButton = styled.button`
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;

  &:hover {
    opacity: 0.7;
  }
`;

const Dot = styled.img`
  width: 3px;
  height: 3px;
  display: block;
`;