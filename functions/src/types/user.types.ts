/**
 * User-related type definitions
 */
import { Timestamp } from 'firebase-admin/firestore';
import { MemberGrade, SubscriptionType } from '../config/constants';

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface CurrentSubscription {
  type: SubscriptionType;
  expiresAt: Timestamp;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  memberGrade: MemberGrade;
  referralCode: string;  // 8자리 영문+숫자
  referredBy?: string;   // 추천인 UID
  referredUsers: string[];
  creditBalance: number;
  bankAccount?: BankAccount;
  currentSubscription?: CurrentSubscription;
  serviceUsage: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface UserCreateData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface UserSignupResponse {
  uid: string;
  referralCode: string;
}

export interface UserLoginResponse {
  token: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
    memberGrade: MemberGrade;
    referralCode: string;
  };
}