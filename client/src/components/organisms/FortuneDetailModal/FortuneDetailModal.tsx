/**
 * FortuneDetailModal Component
 * 운세 전문 표시 모달
 */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';
import { FortuneResult, getFortuneTypeName, getFortuneTypeEmoji } from '../../../services/fortuneHistory';
import { formatKoreanDate } from '../../../utils/date';

interface FortuneDetailModalProps {
  fortune: FortuneResult;
  isOpen: boolean;
  onClose: () => void;
}

export const FortuneDetailModal: React.FC<FortuneDetailModalProps> = ({ fortune, isOpen, onClose }) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <ModalContainer>
        <ModalHeader>
          <HeaderContent>
            <EmojiIcon>{getFortuneTypeEmoji(fortune.serviceType)}</EmojiIcon>
            <TitleSection>
              <Title>{getFortuneTypeName(fortune.serviceType)}</Title>
              <Date>{formatKoreanDate(fortune.createdAt)}</Date>
            </TitleSection>
          </HeaderContent>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <ContentHTML dangerouslySetInnerHTML={{ __html: fortune.aiResponse.html }} />
        </ModalBody>
      </ModalContainer>
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
  z-index: 1000;
  animation: fadeIn ${tokens.animation.duration.base} ${tokens.animation.easing.easeOut};

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background: ${tokens.colors.neutral[0]};
  border-radius: ${tokens.borderRadius.lg};
  z-index: 1001;
  display: flex;
  flex-direction: column;
  animation: slideUp ${tokens.animation.duration.base} ${tokens.animation.easing.easeOut};

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, -45%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 95%;
    max-height: 95vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacing[6]};
  border-bottom: 1px solid ${tokens.colors.neutral[200]};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing[3]};
`;

const EmojiIcon = styled.div`
  font-size: ${tokens.typography.fontSize['3xl']};
  line-height: 1;
`;

const TitleSection = styled.div``;

const Title = styled.h2`
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral[800]};
  margin: 0 0 ${tokens.spacing[1]} 0;
`;

const Date = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.neutral[500]};
  margin: 0;
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: ${tokens.colors.neutral[100]};
  color: ${tokens.colors.neutral[600]};
  font-size: ${tokens.typography.fontSize.xl};
  border-radius: ${tokens.borderRadius.full};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${tokens.animation.duration.fast} ${tokens.animation.easing.easeOut};

  &:hover {
    background: ${tokens.colors.neutral[200]};
    color: ${tokens.colors.neutral[800]};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ModalBody = styled.div`
  padding: ${tokens.spacing[6]};
  overflow-y: auto;
  flex: 1;
`;

const ContentHTML = styled.div`
  color: ${tokens.colors.neutral[800]};
  line-height: 1.8;

  h1, h2, h3 {
    margin-top: ${tokens.spacing[6]};
    margin-bottom: ${tokens.spacing[3]};
    color: ${tokens.colors.neutral[800]};
  }

  h1 {
    font-size: ${tokens.typography.fontSize['3xl']};
  }

  h2 {
    font-size: ${tokens.typography.fontSize['2xl']};
  }

  h3 {
    font-size: ${tokens.typography.fontSize.xl};
  }

  p {
    margin-bottom: ${tokens.spacing[3]};
  }

  section {
    margin-bottom: ${tokens.spacing[6]};
  }
`;
