import mongoose from 'mongoose';

export interface IInsuranceProvider extends mongoose.Document {
  name: string;
  type: 'AUTO' | 'HOME' | 'HEALTH' | 'LIFE' | 'DISABILITY' | 'RENTERS' | 'UMBRELLA' | 'BUSINESS' | 'MULTI_LINE';
  
  // Contact Information
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Company Details
  rating?: string; // AM Best, S&P, Moody's ratings
  foundedYear?: number;
  headquarters?: string;
  description?: string;
  
  // Service Information
  customerServiceHours?: string;
  claimsPhone?: string;
  claimsEmail?: string;
  onlinePortal?: string;
  
  // Additional Details
  specialties?: string[];
  coverageStates?: string[];
  notes?: string;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceProviderSchema = new mongoose.Schema<IInsuranceProvider>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['AUTO', 'HOME', 'HEALTH', 'LIFE', 'DISABILITY', 'RENTERS', 'UMBRELLA', 'BUSINESS', 'MULTI_LINE'],
      required: true,
      index: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    website: {
      type: String,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'USA' },
    },
    rating: {
      type: String,
    },
    foundedYear: {
      type: Number,
    },
    headquarters: {
      type: String,
    },
    description: {
      type: String,
    },
    customerServiceHours: {
      type: String,
    },
    claimsPhone: {
      type: String,
    },
    claimsEmail: {
      type: String,
    },
    onlinePortal: {
      type: String,
    },
    specialties: [{
      type: String,
    }],
    coverageStates: [{
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
InsuranceProviderSchema.index({ type: 1 });
InsuranceProviderSchema.index({ name: 1 });

export default mongoose.models.InsuranceProvider || mongoose.model<IInsuranceProvider>('InsuranceProvider', InsuranceProviderSchema);
