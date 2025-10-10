import mongoose from 'mongoose';

export interface ITaxReturn extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  taxYear: number;
  filingStatus: 'SINGLE' | 'MARRIED_FILING_JOINTLY' | 'MARRIED_FILING_SEPARATELY' | 'HEAD_OF_HOUSEHOLD' | 'QUALIFYING_WIDOW';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_TO_FILE' | 'FILED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED';
  
  // Filing Information
  filingMethod: 'E_FILE' | 'MAIL' | 'TAX_PROFESSIONAL' | 'TAX_SOFTWARE';
  filedDate?: Date;
  dueDate: Date;
  extensionFiled: boolean;
  extendedDueDate?: Date;
  
  // Income Information
  wages: number;
  selfEmploymentIncome: number;
  investmentIncome: number;
  rentalIncome: number;
  retirementIncome: number;
  otherIncome: number;
  totalIncome: number;
  adjustedGrossIncome: number;
  
  // Deductions
  standardDeduction: number;
  itemizedDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  
  // Tax Calculation
  federalTaxWithheld: number;
  estimatedTaxPaid: number;
  totalTaxLiability: number;
  refundAmount: number;
  amountOwed: number;
  
  // State Tax
  stateTaxWithheld: number;
  stateTaxLiability: number;
  stateRefund: number;
  stateOwed: number;
  
  // Professional Information
  taxProfessionalId?: mongoose.Types.ObjectId;
  preparerName?: string;
  preparerPTIN?: string;
  preparerFirm?: string;
  
  // Documents
  w2Forms: number;
  form1099Count: number;
  scheduleC: boolean;
  scheduleD: boolean;
  scheduleE: boolean;
  
  // Additional Details
  notes?: string;
  tags?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TaxReturnSchema = new mongoose.Schema<ITaxReturn>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taxYear: {
      type: Number,
      required: true,
      index: true,
    },
    filingStatus: {
      type: String,
      enum: ['SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW'],
      required: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'READY_TO_FILE', 'FILED', 'ACCEPTED', 'REJECTED', 'AMENDED'],
      default: 'NOT_STARTED',
      required: true,
      index: true,
    },
    filingMethod: {
      type: String,
      enum: ['E_FILE', 'MAIL', 'TAX_PROFESSIONAL', 'TAX_SOFTWARE'],
      default: 'E_FILE',
    },
    filedDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    extensionFiled: {
      type: Boolean,
      default: false,
    },
    extendedDueDate: {
      type: Date,
    },
    wages: {
      type: Number,
      default: 0,
      min: 0,
    },
    selfEmploymentIncome: {
      type: Number,
      default: 0,
    },
    investmentIncome: {
      type: Number,
      default: 0,
    },
    rentalIncome: {
      type: Number,
      default: 0,
    },
    retirementIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherIncome: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    adjustedGrossIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    standardDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    itemizedDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    federalTaxWithheld: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedTaxPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTaxLiability: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountOwed: {
      type: Number,
      default: 0,
      min: 0,
    },
    stateTaxWithheld: {
      type: Number,
      default: 0,
      min: 0,
    },
    stateTaxLiability: {
      type: Number,
      default: 0,
      min: 0,
    },
    stateRefund: {
      type: Number,
      default: 0,
      min: 0,
    },
    stateOwed: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxProfessionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxProfessional',
      index: true,
    },
    preparerName: {
      type: String,
    },
    preparerPTIN: {
      type: String,
    },
    preparerFirm: {
      type: String,
    },
    w2Forms: {
      type: Number,
      default: 0,
      min: 0,
    },
    form1099Count: {
      type: Number,
      default: 0,
      min: 0,
    },
    scheduleC: {
      type: Boolean,
      default: false,
    },
    scheduleD: {
      type: Boolean,
      default: false,
    },
    scheduleE: {
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
TaxReturnSchema.index({ userId: 1, taxYear: -1 });
TaxReturnSchema.index({ userId: 1, status: 1 });
TaxReturnSchema.index({ dueDate: 1 });

export default mongoose.models.TaxReturn || mongoose.model<ITaxReturn>('TaxReturn', TaxReturnSchema);
