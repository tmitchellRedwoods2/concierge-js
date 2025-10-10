import mongoose from 'mongoose';

export interface ILegalCase extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  caseNumber: string;
  title: string;
  description: string;
  caseType: 'PERSONAL_INJURY' | 'FAMILY_LAW' | 'CRIMINAL' | 'BUSINESS' | 'REAL_ESTATE' | 'ESTATE_PLANNING' | 'IMMIGRATION' | 'EMPLOYMENT' | 'CONTRACT' | 'OTHER';
  status: 'ACTIVE' | 'CLOSED' | 'PENDING' | 'ON_HOLD' | 'SETTLED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Case Details
  startDate: Date;
  endDate?: Date;
  estimatedResolution?: Date;
  jurisdiction: string;
  courtName?: string;
  judgeName?: string;
  
  // Financial Information
  estimatedCost: number;
  actualCost: number;
  retainerAmount: number;
  hourlyRate?: number;
  contingencyFee?: number;
  
  // Legal Team
  primaryAttorney?: string;
  lawFirmId?: mongoose.Types.ObjectId;
  paralegal?: string;
  legalAssistant?: string;
  
  // Case Progress
  lastActivity: Date;
  nextCourtDate?: Date;
  nextDeadline?: Date;
  milestones: Array<{
    title: string;
    description: string;
    dueDate: Date;
    completed: boolean;
    completedDate?: Date;
  }>;
  
  // Related Information
  opposingParty?: string;
  opposingCounsel?: string;
  witnesses?: string[];
  evidence?: string[];
  
  // Additional Details
  notes?: string;
  tags?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const LegalCaseSchema = new mongoose.Schema<ILegalCase>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    caseType: {
      type: String,
      enum: ['PERSONAL_INJURY', 'FAMILY_LAW', 'CRIMINAL', 'BUSINESS', 'REAL_ESTATE', 'ESTATE_PLANNING', 'IMMIGRATION', 'EMPLOYMENT', 'CONTRACT', 'OTHER'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'PENDING', 'ON_HOLD', 'SETTLED', 'DISMISSED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    estimatedResolution: {
      type: Date,
    },
    jurisdiction: {
      type: String,
      required: true,
    },
    courtName: {
      type: String,
    },
    judgeName: {
      type: String,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    retainerAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    contingencyFee: {
      type: Number,
      min: 0,
      max: 100,
    },
    primaryAttorney: {
      type: String,
    },
    lawFirmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LawFirm',
      index: true,
    },
    paralegal: {
      type: String,
    },
    legalAssistant: {
      type: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    nextCourtDate: {
      type: Date,
    },
    nextDeadline: {
      type: Date,
    },
    milestones: [{
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      dueDate: {
        type: Date,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedDate: {
        type: Date,
      },
    }],
    opposingParty: {
      type: String,
    },
    opposingCounsel: {
      type: String,
    },
    witnesses: [{
      type: String,
    }],
    evidence: [{
      type: String,
    }],
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
LegalCaseSchema.index({ userId: 1, status: 1 });
LegalCaseSchema.index({ userId: 1, caseType: 1 });
LegalCaseSchema.index({ userId: 1, priority: 1 });
LegalCaseSchema.index({ nextCourtDate: 1 });
LegalCaseSchema.index({ nextDeadline: 1 });
LegalCaseSchema.index({ lastActivity: -1 });

export default mongoose.models.LegalCase || mongoose.model<ILegalCase>('LegalCase', LegalCaseSchema);
