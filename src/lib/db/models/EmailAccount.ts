import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailAccount extends Document {
  userId: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  credentials: {
    // For Gmail OAuth
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    // For Outlook OAuth
    tenantId?: string;
    // For IMAP/Exchange
    username?: string;
    password?: string;
    server?: string;
    port?: number;
    secure?: boolean;
  };
  enabled: boolean;
  lastChecked?: Date;
  lastMessageId?: string;
  scanInterval: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

const EmailAccountSchema = new Schema<IEmailAccount>({
  userId: { type: String, required: true, index: true },
  emailAddress: { type: String, required: true, index: true },
  provider: { 
    type: String, 
    required: true, 
    enum: ['gmail', 'outlook', 'imap', 'exchange'] 
  },
  credentials: {
    accessToken: { type: String, select: false }, // Don't return in queries by default
    refreshToken: { type: String, select: false },
    clientId: { type: String, select: false },
    clientSecret: { type: String, select: false },
    tenantId: { type: String, select: false }, // For Outlook
    username: { type: String, select: false },
    password: { type: String, select: false },
    server: { type: String },
    port: { type: Number },
    secure: { type: Boolean, default: true }
  },
  enabled: { type: Boolean, default: true },
  lastChecked: { type: Date },
  lastMessageId: { type: String },
  scanInterval: { type: Number, default: 15 } // Default: check every 15 minutes
}, {
  timestamps: true
});

// Compound index for user + email
EmailAccountSchema.index({ userId: 1, emailAddress: 1 }, { unique: true });

export default mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);

