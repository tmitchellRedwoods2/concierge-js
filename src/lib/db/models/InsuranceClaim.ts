import mongoose from 'mongoose';

export interface IInsuranceClaim extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  policyId: mongoose.Types.ObjectId;
  claimNumber: string;
  status: 'FILED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'PAID' | 'CLOSED';
  claimType: 'AUTO_ACCIDENT' | 'HOME_DAMAGE' | 'HEALTH_MEDICAL' | 'THEFT' | 'LIABILITY' | 'OTHER';
  
  // Claim Details
  description: string;
  incidentDate: Date;
  filingDate: Date;
  location?: string;
  
  // Financial Information
  claimAmount: number;
  deductibleAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  
  // Supporting Documents
  documents?: string[]; // URLs or file paths
  photos?: string[]; // URLs or file paths
  
  // Contact Information
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  
  // Additional Details
  notes?: string;
  resolutionNotes?: string;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceClaimSchema = new mongoose.Schema<IInsuranceClaim>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsurancePolicy',
      required: true,
      index: true,
    },
    claimNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['FILED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'PAID', 'CLOSED'],
      default: 'FILED',
      required: true,
      index: true,
    },
    claimType: {
      type: String,
      enum: ['AUTO_ACCIDENT', 'HOME_DAMAGE', 'HEALTH_MEDICAL', 'THEFT', 'LIABILITY', 'OTHER'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
      index: true,
    },
    filingDate: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
    },
    claimAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deductibleAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedAmount: {
      type: Number,
      min: 0,
    },
    paidAmount: {
      type: Number,
      min: 0,
    },
    documents: [{
      type: String,
    }],
    photos: [{
      type: String,
    }],
    adjusterName: {
      type: String,
    },
    adjusterPhone: {
      type: String,
    },
    adjusterEmail: {
      type: String,
    },
    notes: {
      type: String,
    },
    resolutionNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
InsuranceClaimSchema.index({ userId: 1, status: 1 });
InsuranceClaimSchema.index({ policyId: 1, filingDate: -1 });
InsuranceClaimSchema.index({ claimNumber: 1 });
InsuranceClaimSchema.index({ incidentDate: -1 });

export default mongoose.models.InsuranceClaim || mongoose.model<IInsuranceClaim>('InsuranceClaim', InsuranceClaimSchema);
