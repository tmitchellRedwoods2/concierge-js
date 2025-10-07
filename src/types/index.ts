/**
 * Core type definitions for Concierge.js
 * Migrated from Python/Streamlit application
 */

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: 'basic' | 'premium' | 'elite';
  netWorth?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Service Plans
export interface ServicePlan {
  name: string;
  price: number;
  features: string[];
}

export const SERVICE_PLANS: Record<string, ServicePlan> = {
  basic: {
    name: 'Basic',
    price: 29,
    features: [
      '✅ Core service management',
      '✅ Mobile app access',
      '✅ Email support (24-48 hours)',
      '✅ Basic reporting'
    ]
  },
  premium: {
    name: 'Premium',
    price: 99,
    features: [
      '✅ All Basic features',
      '✅ Priority support (4-12 hours)',
      '✅ Advanced analytics',
      '✅ AI-powered insights',
      '✅ Custom integrations'
    ]
  },
  elite: {
    name: 'Elite',
    price: 299,
    features: [
      '✅ All Premium features',
      '✅ White-glove service',
      '✅ Monthly strategy sessions',
      '✅ Direct CPA & legal counsel',
      '✅ Exclusive partner discounts'
    ]
  }
};

// Client Intake
export interface ClientIntake {
  id: string;
  userId: string;
  goals: string[];
  netWorth: number;
  annualIncome: number;
  selectedServices: string[];
  recommendedPlan: string;
  pricing: {
    monthly: number;
    annual: number;
    discount: number;
  };
  createdAt: Date;
}

// Service Types
export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  source?: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  broker?: string;
  createdAt: Date;
}

export interface Prescription {
  id: string;
  userId: string;
  medication: string;
  dosage: string;
  frequency: string;
  pharmacy?: string;
  refillDate?: Date;
  createdAt: Date;
}

export interface Insurance {
  id: string;
  userId: string;
  provider: string;
  policyNumber: string;
  type: string;
  coverage: number;
  premium: number;
  expiryDate: Date;
}

export interface LegalCase {
  id: string;
  userId: string;
  title: string;
  type: string;
  status: string;
  lawFirm?: string;
  documents: string[];
  createdAt: Date;
}

export interface TaxDocument {
  id: string;
  userId: string;
  year: number;
  type: string;
  provider?: string;
  status: string;
  filedDate?: Date;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  service?: string;
  bookings: string[];
  status: string;
}

export interface Message {
  id: string;
  userId: string;
  channel: 'concierge' | 'ai' | 'support';
  content: string;
  sender: 'user' | 'system';
  read: boolean;
  createdAt: Date;
}

// Admin Types
export interface Admin {
  id: string;
  username: string;
  role: 'super_admin' | 'manager' | 'support' | 'analyst';
  permissions: string[];
}

export interface SystemMetrics {
  totalUsers: number;
  activeSessions: number;
  messagesSent: number;
  prescriptionsManaged: number;
  aiTasksCompleted: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pricing Constants
export const SERVICE_PRICING: Record<string, number> = {
  'Health Management': 20,
  'Investment Management': 50,
  'Expense Tracking': 15,
  'Tax Planning': 75,
  'Legal Services': 100,
  'Travel Planning': 30,
  'Insurance Management': 25,
  'AI Concierge': 40
};

export const NET_WORTH_MULTIPLIERS: Record<string, number> = {
  '<100k': 1.0,
  '100k-500k': 1.2,
  '500k-1M': 1.5,
  '1M-5M': 2.0,
  '5M+': 3.0
};

