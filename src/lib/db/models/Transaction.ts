import mongoose from 'mongoose';

export interface ITransaction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  plaidTransactionId: string;
  amount: number;
  date: Date;
  name: string;
  merchantName?: string;
  category: string[];
  categoryId?: string;
  accountOwner?: string;
  isRecurring: boolean;
  customCategory?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    plaidTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    merchantName: {
      type: String,
    },
    category: [{
      type: String,
    }],
    categoryId: {
      type: String,
    },
    accountOwner: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    customCategory: {
      type: String,
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
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ plaidTransactionId: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ amount: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
