import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../../design-system/tokens';

interface FortuneServiceCardProps {
  title: string;
  description: string;
  image: string;
  onClick?: () => void;
  'data-name'?: string;
}

const Card = styled.div`
  background-color: ${tokens.colors.neutral[50]};
  border-radius: 20px;
  padding: 60px 80px;
  display: flex;
  gap: 50px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${tokens.animation.duration.base} ${tokens.animation.easing.easeOut};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
    opacity: 0;
    transition: opacity ${tokens.animation.duration.base} ${tokens.animation.easing.ease};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${tokens.shadows.lg};
    background-color: ${tokens.colors.neutral[0]};

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Title = styled.h3`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 25px;
  font-weight: ${tokens.typography.fontWeight.bold};
  line-height: 35px;
  color: ${tokens.colors.neutral[800]};
  margin: 0;
  letter-spacing: -1.25px;
`;

const Description = styled.p`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.light};
  line-height: 25px;
  color: ${tokens.colors.neutral[800]};
  margin: 0;
  letter-spacing: -0.8px;
  white-space: pre-line;
`;

const ImageContainer = styled.div`
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    max-height: 100%;
    max-width: 150px;
    object-fit: contain;
  }
`;

export const FortuneServiceCard: React.FC<FortuneServiceCardProps> = ({
  title,
  description,
  image,
  onClick,
  ...props
}) => {
  return (
    <Card onClick={onClick} {...props}>
      <TextContainer>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </TextContainer>
      <ImageContainer>
        <img src={image} alt={title} />
      </ImageContainer>
    </Card>
  );
};