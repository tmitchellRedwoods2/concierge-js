import mongoose from 'mongoose';

export interface ITaxDeduction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  taxReturnId?: mongoose.Types.ObjectId;
  taxYear: number;
  
  // Deduction Information
  category: 'MORTGAGE_INTEREST' | 'PROPERTY_TAX' | 'CHARITABLE' | 'MEDICAL' | 'STATE_LOCAL_TAX' | 'BUSINESS_EXPENSE' | 'HOME_OFFICE' | 'VEHICLE' | 'EDUCATION' | 'RETIREMENT' | 'OTHER';
  description: string;
  amount: number;
  date: Date;
  
  // Supporting Information
  receiptNumber?: string;
  vendor?: string;
  paymentMethod?: string;
  documentPath?: string;
  
  // Business Related
  businessPurpose?: string;
  mileage?: number;
  
  // Status
  verified: boolean;
  approved: boolean;
  
  // Additional Details
  notes?: string;
  tags?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TaxDeductionSchema = new mongoose.Schema<ITaxDeduction>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taxReturnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxReturn',
      index: true,
    },
    taxYear: {
      type: Number,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['MORTGAGE_INTEREST', 'PROPERTY_TAX', 'CHARITABLE', 'MEDICAL', 'STATE_LOCAL_TAX', 'BUSINESS_EXPENSE', 'HOME_OFFICE', 'VEHICLE', 'EDUCATION', 'RETIREMENT', 'OTHER'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
    },
    vendor: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    documentPath: {
      type: String,
    },
    businessPurpose: {
      type: String,
    },
    mileage: {
      type: Number,
      min: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TaxDeductionSchema.index({ userId: 1, taxYear: 1 });
TaxDeductionSchema.index({ userId: 1, category: 1 });
TaxDeductionSchema.index({ date: -1 });

export default mongoose.models.TaxDeduction || mongoose.model<ITaxDeduction>('TaxDeduction', TaxDeductionSchema);
