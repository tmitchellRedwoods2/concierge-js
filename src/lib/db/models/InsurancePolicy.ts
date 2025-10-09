import mongoose from 'mongoose';

export interface IInsurancePolicy extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  policyNumber: string;
  policyType: 'AUTO' | 'HOME' | 'HEALTH' | 'LIFE' | 'DISABILITY' | 'RENTERS' | 'UMBRELLA' | 'BUSINESS';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  
  // Policy Details
  policyName: string;
  description?: string;
  coverageAmount: number;
  deductible: number;
  premiumAmount: number;
  premiumFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  
  // Dates
  effectiveDate: Date;
  expirationDate: Date;
  renewalDate?: Date;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  
  // Contact Information
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  
  // Additional Details
  beneficiaries?: string[];
  riders?: string[];
  notes?: string;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const InsurancePolicySchema = new mongoose.Schema<IInsurancePolicy>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceProvider',
      required: false,
      index: true,
    },
    policyNumber: {
      type: String,
      required: true,
    },
    policyType: {
      type: String,
      enum: ['AUTO', 'HOME', 'HEALTH', 'LIFE', 'DISABILITY', 'RENTERS', 'UMBRELLA', 'BUSINESS'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    policyName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    coverageAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deductible: {
      type: Number,
      required: true,
      min: 0,
    },
    premiumAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    premiumFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'],
      default: 'ANNUAL',
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      index: true,
    },
    expirationDate: {
      type: Date,
      required: true,
      index: true,
    },
    renewalDate: {
      type: Date,
    },
    lastPaymentDate: {
      type: Date,
    },
    nextPaymentDate: {
      type: Date,
    },
    agentName: {
      type: String,
    },
    agentPhone: {
      type: String,
    },
    agentEmail: {
      type: String,
    },
    beneficiaries: [{
      type: String,
    }],
    riders: [{
      type: String,
    }],
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
InsurancePolicySchema.index({ userId: 1, policyType: 1 });
InsurancePolicySchema.index({ userId: 1, status: 1 });
InsurancePolicySchema.index({ expirationDate: 1 });
InsurancePolicySchema.index({ nextPaymentDate: 1 });

export default mongoose.models.InsurancePolicy || mongoose.model<IInsurancePolicy>('InsurancePolicy', InsurancePolicySchema);
