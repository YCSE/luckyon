/**
 * Auth Context
 * 인증 상태 관리
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  userInfo: UserInfo | null;
  loading: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkServiceAccess: (serviceType: string) => boolean;
  refreshUserInfo: () => Promise<void>;
}

interface UserInfo {
  uid: string;
  email: string;
  displayName: string;
  memberGrade: string;
  referralCode: string;
  creditBalance: number;
  subscription?: {
    productType: string;
    expiresAt: Date;
  };
  oneTimePurchases?: string[];
}

interface SignupData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // ID Token 가져오기
        const idToken = await firebaseUser.getIdToken();

        // 사용자 정보 조회
        try {
          const response: any = await authAPI.verifyToken(idToken);
          if (response.success) {
            setUserInfo(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (data: SignupData) => {
    try {
      const response: any = await authAPI.signup(data);

      if (response.success) {
        // Custom Token으로 로그인
        const customToken = response.data.customToken;
        await signInWithCustomToken(auth, customToken);
      } else {
        throw new Error('Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response: any = await authAPI.login({ email, password });

      if (response.success) {
        // Custom Token으로 로그인
        const customToken = response.data.customToken;
        await signInWithCustomToken(auth, customToken);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const refreshUserInfo = async () => {
    if (user) {
      const idToken = await user.getIdToken(true); // force refresh
      try {
        const response: any = await authAPI.verifyToken(idToken);
        if (response.success) {
          setUserInfo(response.data);
        }
      } catch (error) {
        console.error('Failed to refresh user info:', error);
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const checkServiceAccess = (serviceType: string): boolean => {
    if (!userInfo) return false;

    // 구독 확인
    if (userInfo.subscription) {
      const expiresAt = new Date(userInfo.subscription.expiresAt);
      if (expiresAt > new Date()) {
        return true;
      }
    }

    // 일회성 구매 확인
    if (userInfo.oneTimePurchases?.includes(serviceType)) {
      return true;
    }

    return false;
  };

  const value: AuthContextType = {
    user,
    userInfo,
    loading,
    signup,
    login,
    logout,
    checkServiceAccess,
    refreshUserInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};