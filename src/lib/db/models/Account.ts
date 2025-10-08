import mongoose from 'mongoose';

export interface IAccount extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  plaidAccountId: string;
  plaidItemId: string;
  accessToken: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
  isActive: boolean;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new mongoose.Schema<IAccount>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plaidAccountId: {
      type: String,
      required: true,
      unique: true,
    },
    plaidItemId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    subtype: {
      type: String,
      required: true,
    },
    mask: {
      type: String,
      required: true,
    },
    balances: {
      available: Number,
      current: Number,
      limit: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSync: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
AccountSchema.index({ userId: 1, isActive: 1 });
AccountSchema.index({ plaidAccountId: 1 });

export default mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
