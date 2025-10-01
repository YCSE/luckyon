/**
 * HamburgerMenu Component
 * 권한별 메뉴 표시
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { tokens } from '../../design-system/tokens';
import { useAuth } from '../../contexts/AuthContext';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, userInfo, logout } = useAuth();

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

  const isRegularOrSpecial = userInfo?.memberGrade === 'regular' || userInfo?.memberGrade === 'special';
  const isAdmin = userInfo?.memberGrade === 'admin';

  return (
    <>
      <Overlay onClick={onClose} />
      <MenuContainer>
        <MenuHeader>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </MenuHeader>

        {user && userInfo ? (
          <>
            <UserInfo>
              <UserName>{userInfo.displayName}</UserName>
              <UserEmail>{userInfo.email}</UserEmail>
              <UserGrade>
                등급: {userInfo.memberGrade === 'member' ? '일반회원' :
                       userInfo.memberGrade === 'regular' ? '정회원' :
                       userInfo.memberGrade === 'special' ? '특별회원' : '관리자'}
              </UserGrade>
            </UserInfo>

            <Divider />

            <MenuList>
              <MenuItem onClick={() => handleNavigate('/')}>
                <MenuIcon>🏠</MenuIcon>
                <MenuText>홈</MenuText>
              </MenuItem>

              <MenuItem onClick={() => handleNavigate('/pricing')}>
                <MenuIcon>💳</MenuIcon>
                <MenuText>결제하기</MenuText>
              </MenuItem>

              {(isRegularOrSpecial || isAdmin) && (
                <>
                  <MenuItem onClick={() => handleNavigate('/referral')}>
                    <MenuIcon>🎁</MenuIcon>
                    <MenuText>리퍼럴 통계</MenuText>
                  </MenuItem>

                  <MenuItem onClick={() => handleNavigate('/withdrawal')}>
                    <MenuIcon>💰</MenuIcon>
                    <MenuText>출금 요청</MenuText>
                  </MenuItem>
                </>
              )}

              {isAdmin && (
                <MenuItem onClick={() => handleNavigate('/admin')}>
                  <MenuIcon>⚙️</MenuIcon>
                  <MenuText>관리자 대시보드</MenuText>
                </MenuItem>
              )}

              <Divider />

              <MenuItem onClick={() => handleNavigate('/profile')}>
                <MenuIcon>👤</MenuIcon>
                <MenuText>내 정보</MenuText>
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <MenuIcon>🚪</MenuIcon>
                <MenuText>로그아웃</MenuText>
              </MenuItem>
            </MenuList>
          </>
        ) : (
          <MenuList>
            <MenuItem onClick={() => handleNavigate('/login')}>
              <MenuIcon>🔐</MenuIcon>
              <MenuText>로그인</MenuText>
            </MenuItem>
          </MenuList>
        )}
      </MenuContainer>
    </>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const MenuContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 85vw;
  background: ${tokens.colors.neutral[0]};
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow-y: auto;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${tokens.colors.neutral[800]};
  cursor: pointer;
  padding: 8px;

  &:hover {
    opacity: 0.7;
  }
`;

const UserInfo = styled.div`
  padding: 0 24px 20px;
`;

const UserName = styled.div`
  font-size: 20px;
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${tokens.colors.neutral[600]};
  margin-bottom: 8px;
`;

const UserGrade = styled.div`
  font-size: 12px;
  color: ${tokens.colors.primary[500]};
  font-weight: ${tokens.typography.fontWeight.medium};
  display: inline-block;
  padding: 4px 12px;
  background: ${tokens.colors.primary[100]};
  border-radius: 12px;
`;

const Divider = styled.div`
  height: 1px;
  background: ${tokens.colors.neutral[300]};
  margin: 12px 0;
`;

const MenuList = styled.div`
  padding: 0 12px;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: ${tokens.colors.neutral[50]};
  }
`;

const MenuIcon = styled.span`
  font-size: 20px;
  width: 24px;
  text-align: center;
`;

const MenuText = styled.span`
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.neutral[800]};
`;