import mongoose from 'mongoose';

export interface IPortfolio extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new mongoose.Schema<IPortfolio>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    totalGainLoss: {
      type: Number,
      default: 0,
    },
    totalGainLossPercent: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
PortfolioSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
