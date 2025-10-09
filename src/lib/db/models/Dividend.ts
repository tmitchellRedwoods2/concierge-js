import mongoose from 'mongoose';

export interface IDividend extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId;
  holdingId: mongoose.Types.ObjectId;
  symbol: string;
  amount: number;
  shares: number;
  dividendPerShare: number;
  exDate: Date;
  recordDate: Date;
  payDate: Date;
  status: 'DECLARED' | 'EX_DIVIDEND' | 'PAID';
  type: 'REGULAR' | 'SPECIAL' | 'STOCK_SPLIT';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DividendSchema = new mongoose.Schema<IDividend>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    holdingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Holding',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
    },
    dividendPerShare: {
      type: Number,
      required: true,
      min: 0,
    },
    exDate: {
      type: Date,
      required: true,
      index: true,
    },
    recordDate: {
      type: Date,
      required: true,
    },
    payDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DECLARED', 'EX_DIVIDEND', 'PAID'],
      default: 'DECLARED',
      required: true,
    },
    type: {
      type: String,
      enum: ['REGULAR', 'SPECIAL', 'STOCK_SPLIT'],
      default: 'REGULAR',
      required: true,
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
DividendSchema.index({ userId: 1, portfolioId: 1 });
DividendSchema.index({ symbol: 1, exDate: -1 });
DividendSchema.index({ status: 1, payDate: 1 });
DividendSchema.index({ userId: 1, payDate: -1 });

export default mongoose.models.Dividend || mongoose.model<IDividend>('Dividend', DividendSchema);
