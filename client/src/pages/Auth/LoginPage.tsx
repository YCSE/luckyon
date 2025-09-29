import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Footer } from '../../components/organisms/Footer';
import { FortuneServiceCard } from '../../components/molecules/FortuneServiceCard';
import { tokens } from '../../design-system/tokens';

// Image assets from Figma
const imgBg1 = '/assets/images/hero-bg.png';

const Container = styled.div`
  background-color: ${tokens.colors.neutral[0]};
  position: relative;
  width: 100%;
  min-height: 100vh;
`;

const HeroSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, #cccccc 0%, #e0e0e0 100%);
  height: 810px;
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  mix-blend-mode: multiply;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeroTitle = styled.h1`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 65px;
  font-weight: ${tokens.typography.fontWeight.bold};
  line-height: 80px;
  color: ${tokens.colors.neutral[0]};
  text-align: center;
  letter-spacing: -3.25px;
  position: relative;
  z-index: 1;
  margin: 0;
`;

const HeroSubtitle = styled.p`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 25px;
  font-weight: ${tokens.typography.fontWeight.medium};
  line-height: 40px;
  color: ${tokens.colors.neutral[0]};
  text-align: center;
  letter-spacing: -1.25px;
  position: relative;
  z-index: 1;
  margin-top: 20px;
`;

const ContentSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 150px 20px;
`;

const SectionTitle = styled.h2`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 45px;
  font-weight: ${tokens.typography.fontWeight.semibold};
  line-height: 60px;
  color: ${tokens.colors.neutral[800]};
  text-align: center;
  letter-spacing: -2.25px;
  margin-bottom: 70px;
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 150px;

  @media (max-width: ${tokens.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const LoginSection = styled.section`
  max-width: 400px;
  margin: 0 auto;
  padding: 50px 20px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 30px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 15px 0;
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 16px;
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${props => props.$active ? tokens.colors.primary[500] : '#aaaaaa'};
  background: none;
  border: none;
  border-bottom: 1px solid ${props => props.$active ? tokens.colors.primary[500] : '#dddddd'};
  cursor: pointer;
  transition: all ${tokens.animation.duration.base} ${tokens.animation.easing.ease};

  &:hover {
    color: ${tokens.colors.primary[500]};
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const LoginButton = styled(Button)`
  width: 250px;
  margin: 40px auto 20px;
`;

const SignupPrompt = styled.p`
  font-family: ${tokens.typography.fontFamily.primary};
  font-size: 14px;
  font-weight: ${tokens.typography.fontWeight.light};
  color: #777777;
  text-align: center;
  letter-spacing: -0.7px;
  margin-top: 30px;
`;

const SignupLink = styled.span`
  color: ${tokens.colors.primary[500]};
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, #dddddd, transparent);
  margin: 100px 0;
`;

// Fortune service data
const fortuneServices = [
  {
    id: 'today',
    title: '오늘의 운세',
    description: '오늘은 어떤 기운이 따를까요?\n오늘 하루를 바꿀 작은 행운',
    icon: '🔮',
    color: tokens.colors.primary[500]
  },
  {
    id: 'saju',
    title: '사주팔자',
    description: '사주로 보는 내 삶의 설계도,\n태어난 순간이 말해주는 내 인생의 길',
    icon: '📅',
    color: tokens.colors.secondary[500]
  },
  {
    id: 'compatibility',
    title: '궁합',
    description: '우린 정말 잘 맞을까?\n궁합으로 알아보는 우리 사이',
    icon: '💕',
    color: '#FF69B4'
  },
  {
    id: 'love',
    title: '연애운',
    description: '두근거리는 만남의 시작,\n마음을 설레게 할 인연의 기운',
    icon: '🌸',
    color: '#FF1493'
  },
  {
    id: 'wealth',
    title: '재물운',
    description: '재물이 들어올 타이밍,\n부를 부르는 기운을 확인하세요',
    icon: '💰',
    color: '#FFD700'
  },
  {
    id: 'tojung',
    title: '토정비결',
    description: '다가오는 한 해의 시작,\n럭키온 토정비결로 걱정 끝',
    icon: '☀️',
    color: '#FFA500'
  }
];

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase auth login
    console.log('Login attempt:', { email, password });
  };

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    if (tab === 'signup') {
      navigate('/signup');
    }
  };

  return (
    <Container data-name="접속_로그인" data-node-id="85:96">
      <HeroSection data-name="Hero" data-node-id="85:130">
        <HeroBackground data-name="bg1" data-node-id="95:94">
          <img src={imgBg1} alt="Hero background" />
        </HeroBackground>
        <HeroTitle data-node-id="85:132">
          오늘 나에게 다가올 행운은?
        </HeroTitle>
        <HeroSubtitle data-node-id="85:133">
          당신의 행운이 빛나는 순간을 밝혀드립니다
        </HeroSubtitle>
      </HeroSection>

      <ContentSection>
        <SectionTitle data-node-id="85:162">
          당신을 빛내주는<br />
          숨겨진 행운의 메세지
        </SectionTitle>

        <ServiceGrid data-name="list" data-node-id="141:104">
          {fortuneServices.map((service) => (
            <FortuneServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              icon={service.icon}
              color={service.color}
              data-name={service.id}
            />
          ))}
        </ServiceGrid>

        <Divider data-name="Line" data-node-id="85:286" />

        <SectionTitle data-node-id="85:296">
          럭키온이 전하는 행운,<br />
          지금 확인해 보세요!
        </SectionTitle>

        <LoginSection>
          <TabContainer data-name="tab" data-node-id="85:347">
            <Tab
              $active={activeTab === 'login'}
              onClick={() => handleTabChange('login')}
              data-name="로그인"
              data-node-id="85:329"
            >
              로그인
            </Tab>
            <Tab
              $active={activeTab === 'signup'}
              onClick={() => handleTabChange('signup')}
              data-name="회원가입"
              data-node-id="85:333"
            >
              회원가입
            </Tab>
          </TabContainer>

          <FormContainer onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-name="input"
              data-node-id="85:310"
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-name="input"
              data-node-id="85:311"
            />
            <LoginButton
              type="submit"
              variant="primary"
              size="large"
              data-name="btn1"
              data-node-id="85:313"
            >
              로그인
            </LoginButton>
          </FormContainer>

          <SignupPrompt data-node-id="85:312">
            계정이 없으신가요? {' '}
            <SignupLink onClick={() => navigate('/signup')}>
              회원가입
            </SignupLink>
          </SignupPrompt>
        </LoginSection>
      </ContentSection>

      <Footer data-name="Footer" data-node-id="106:87" />
    </Container>
  );
};