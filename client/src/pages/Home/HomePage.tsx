/**
 * Home Page
 * 6개 운세 서비스 선택 화면
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Header } from '../../components/layout/Header';
import { HamburgerMenu } from '../../components/layout/HamburgerMenu';
import cloverImg from '../../assets/6002cc6e75d95c1d74ff91abadefd0ed9f9ca634.png';
import calendarImg from '../../assets/13a44ddde7bbcd12f6c4ad49848c5ecdbd0c1afd.png';
import heartImg from '../../assets/5536b38b2e4c3639914ade9678b968db458e7116.png';
import flowerImg from '../../assets/fe742ae1dd4747cc2854c5d0189f0053a9c90747.png';
import goldImg from '../../assets/574ea26519541404f65e73f895ac7b0628722845.png';
import sunImg from '../../assets/f91bf7f4e37f21063f53872048d7d211187b53d3.png';

const services = [
  {
    id: 'today',
    title: '오늘의 운세',
    description: '오늘은 어떤 기운이 따를까요?\n오늘 하루를 바꿀 작은 행운',
    image: cloverImg,
    imageWidth: '93.477px',
    imageHeight: '110px',
    path: '/fortune/today'
  },
  {
    id: 'saju',
    title: '사주팔자',
    description: '사주로 보는 내 삶의 설계도,\n태어난 순간이 말해주는 내 인생의 길',
    image: calendarImg,
    imageWidth: '99.817px',
    imageHeight: '102px',
    path: '/fortune/saju'
  },
  {
    id: 'compatibility',
    title: '궁합',
    description: '우린 정말 잘 맞을까? \n궁합으로 알아보는 우리 사이',
    image: heartImg,
    imageWidth: '120.429px',
    imageHeight: '95px',
    path: '/fortune/compatibility'
  },
  {
    id: 'love',
    title: '연애운',
    description: '내 사랑은 언제 찾아올까?\n연애운으로 알아보는 인연의 시작',
    image: flowerImg,
    imageWidth: '134.976px',
    imageHeight: '115px',
    path: '/fortune/love'
  },
  {
    id: 'wealth',
    title: '재물운',
    description: '재물이 들어올 타이밍,\n부를 부르는 기운을 확인하세요',
    image: goldImg,
    imageWidth: '151.996px',
    imageHeight: '100px',
    path: '/fortune/wealth'
  },
  {
    id: 'tojung',
    title: '토정비결',
    description: '다가오는 한 해의 시작, \n럭키온 토정비결로 걱정 끝 ',
    image: sunImg,
    imageWidth: '107.817px',
    imageHeight: '110px',
    path: '/fortune/tojung'
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleServiceClick = (path: string) => {
    navigate(path);
  };

  return (
    <PageWrapper>
      <Container>
        <Header onMenuClick={() => setMenuOpen(true)} />
        <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <ServiceList>
          {services.map((service) => (
            <ServiceCard key={service.id} onClick={() => handleServiceClick(service.path)}>
              <ServiceContent>
                <ServiceTitle>{service.title}</ServiceTitle>
                <ServiceDescription>{service.description}</ServiceDescription>
              </ServiceContent>
              <ServiceImageWrapper
                width={service.imageWidth}
                height={service.imageHeight}
                flip={service.imageFlip}
              >
                <ServiceImage src={service.image} alt={service.title} />
              </ServiceImageWrapper>
            </ServiceCard>
          ))}
        </ServiceList>
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

const ServiceList = styled.div`
  padding: 30px 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ServiceCard = styled.div`
  background: #f8f8f8;
  height: 200px;
  border-radius: 15px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 40px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ServiceContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
`;

const ServiceTitle = styled.h2`
  font-family: 'Pretendard', sans-serif;
  font-size: 25px;
  font-weight: 700;
  line-height: 35px;
  letter-spacing: -1.25px;
  color: #333333;
  margin: 0;
`;

const ServiceDescription = styled.p`
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 25px;
  letter-spacing: -0.8px;
  color: #333333;
  margin: 0;
  white-space: pre-line;
`;

const ServiceImageWrapper = styled.div<{ width: string; height: string; flip?: boolean }>`
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%) ${props => props.flip ? 'scaleY(-1)' : ''};
  width: ${props => props.width};
  height: ${props => props.height};
`;

const ServiceImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;