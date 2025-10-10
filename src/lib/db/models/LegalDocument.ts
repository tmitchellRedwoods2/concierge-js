import mongoose from 'mongoose';

export interface ILegalDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  caseId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  documentType: 'CONTRACT' | 'PLEADING' | 'MOTION' | 'DISCOVERY' | 'EVIDENCE' | 'CORRESPONDENCE' | 'COURT_ORDER' | 'SETTLEMENT' | 'OTHER';
  category: 'LEGAL' | 'EVIDENCE' | 'CORRESPONDENCE' | 'FINANCIAL' | 'MEDICAL' | 'PERSONAL' | 'OTHER';
  
  // File Information
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  fileUrl?: string;
  
  // Document Details
  documentDate: Date;
  receivedDate?: Date;
  sentDate?: Date;
  fromParty?: string;
  toParty?: string;
  confidential: boolean;
  privileged: boolean;
  
  // Legal Information
  courtFiled?: boolean;
  filingDate?: Date;
  caseNumber?: string;
  docketNumber?: string;
  
  // Access Control
  accessLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'PRIVILEGED' | 'RESTRICTED';
  sharedWith: Array<{
    userId: mongoose.Types.ObjectId;
    accessType: 'VIEW' | 'EDIT' | 'DOWNLOAD';
    grantedDate: Date;
    expiresDate?: Date;
  }>;
  
  // Version Control
  version: number;
  previousVersions?: mongoose.Types.ObjectId[];
  isLatestVersion: boolean;
  
  // Additional Details
  tags?: string[];
  notes?: string;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const LegalDocumentSchema = new mongoose.Schema<ILegalDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalCase',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    documentType: {
      type: String,
      enum: ['CONTRACT', 'PLEADING', 'MOTION', 'DISCOVERY', 'EVIDENCE', 'CORRESPONDENCE', 'COURT_ORDER', 'SETTLEMENT', 'OTHER'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['LEGAL', 'EVIDENCE', 'CORRESPONDENCE', 'FINANCIAL', 'MEDICAL', 'PERSONAL', 'OTHER'],
      default: 'LEGAL',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    fileType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    documentDate: {
      type: Date,
      required: true,
      index: true,
    },
    receivedDate: {
      type: Date,
    },
    sentDate: {
      type: Date,
    },
    fromParty: {
      type: String,
    },
    toParty: {
      type: String,
    },
    confidential: {
      type: Boolean,
      default: false,
    },
    privileged: {
      type: Boolean,
      default: false,
    },
    courtFiled: {
      type: Boolean,
      default: false,
    },
    filingDate: {
      type: Date,
    },
    caseNumber: {
      type: String,
    },
    docketNumber: {
      type: String,
    },
    accessLevel: {
      type: String,
      enum: ['PUBLIC', 'CONFIDENTIAL', 'PRIVILEGED', 'RESTRICTED'],
      default: 'CONFIDENTIAL',
      required: true,
      index: true,
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      accessType: {
        type: String,
        enum: ['VIEW', 'EDIT', 'DOWNLOAD'],
        required: true,
      },
      grantedDate: {
        type: Date,
        default: Date.now,
      },
      expiresDate: {
        type: Date,
      },
    }],
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    previousVersions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalDocument',
    }],
    isLatestVersion: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [{
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
LegalDocumentSchema.index({ userId: 1, caseId: 1 });
LegalDocumentSchema.index({ userId: 1, documentType: 1 });
LegalDocumentSchema.index({ userId: 1, category: 1 });
LegalDocumentSchema.index({ userId: 1, accessLevel: 1 });
LegalDocumentSchema.index({ documentDate: -1 });
LegalDocumentSchema.index({ isLatestVersion: 1 });

export default mongoose.models.LegalDocument || mongoose.model<ILegalDocument>('LegalDocument', LegalDocumentSchema);
