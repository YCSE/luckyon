/**
 * HamburgerMenu Component
 * 우측 상단 드롭다운 메뉴
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <MenuContainer ref={menuRef}>
      <MenuItem onClick={() => handleNavigate('/profile')}>
        개인 정보 관리
      </MenuItem>
      <MenuItem onClick={() => handleNavigate('/pricing')}>
        결제 관리
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        로그아웃
      </MenuItem>
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  position: fixed;
  top: 70px;
  right: 30px;
  background: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 5px 5px 30px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 1000;
  min-width: 150px;
`;

const MenuItem = styled.div`
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 25px;
  letter-spacing: -0.8px;
  color: #333333;
  text-align: center;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.7;
  }
`;