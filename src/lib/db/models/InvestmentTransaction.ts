import mongoose from 'mongoose';

export interface IInvestmentTransaction extends mongoose.Document {
  portfolioId: mongoose.Types.ObjectId;
  holdingId?: mongoose.Types.ObjectId;
  symbol: string;
  transactionType: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT';
  shares: number;
  price: number;
  totalAmount: number;
  fees: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentTransactionSchema = new mongoose.Schema<IInvestmentTransaction>(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    holdingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Holding',
      required: false,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    transactionType: {
      type: String,
      enum: ['BUY', 'SELL', 'DIVIDEND', 'SPLIT'],
      required: true,
    },
    shares: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
InvestmentTransactionSchema.index({ portfolioId: 1, date: -1 });
InvestmentTransactionSchema.index({ symbol: 1, date: -1 });
InvestmentTransactionSchema.index({ transactionType: 1 });

export default mongoose.models.InvestmentTransaction || mongoose.model<IInvestmentTransaction>('InvestmentTransaction', InvestmentTransactionSchema);
