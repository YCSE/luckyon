/**
 * Payment-related type definitions
 */
import { Timestamp } from 'firebase-admin/firestore';
import { PaymentStatus } from '../config/constants';

export interface ReferralCredit {
  referrerUid: string;
  creditAmount: number;
  percentage: number;
}

export interface Payment {
  paymentId: string;
  uid: string;
  merchantUid: string;  // LUCKY_YYYYMMDD_XXXXXX
  impUid: string;
  paymentType: 'oneTime' | 'subscription';
  productType: string;
  productName: string;
  amount: number;
  status: PaymentStatus;
  pgProvider: 'KCP';
  referralCredit?: ReferralCredit;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  refundedAt?: Timestamp;
}

export interface PaymentCreateData {
  paymentType: 'oneTime' | 'subscription';
  productType: string;
  amount: number;
}

export interface PaymentCreateResponse {
  merchantUid: string;
  paymentData: {
    paymentId: string;
    impCode: string;
    pgProvider: string;
    status: string;
  };
}

export interface PaymentVerifyData {
  impUid: string;
  merchantUid: string;
}

export interface PaymentVerifyResponse {
  valid: boolean;
  status: string;
}

export interface PaymentCompleteData {
  paymentId: string;
  impUid: string;
}

export interface PaymentCompleteResponse {
  success: boolean;
  subscription?: {
    type: string;
    expiresAt: string;
  };
}