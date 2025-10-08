import mongoose from 'mongoose';

export interface IHolding extends mongoose.Document {
  portfolioId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  shares: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new mongoose.Schema<IHolding>(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
    },
    averageCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    marketValue: {
      type: Number,
      default: 0,
    },
    gainLoss: {
      type: Number,
      default: 0,
    },
    gainLossPercent: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
HoldingSchema.index({ portfolioId: 1, symbol: 1 });
HoldingSchema.index({ symbol: 1 });

export default mongoose.models.Holding || mongoose.model<IHolding>('Holding', HoldingSchema);
