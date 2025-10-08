import mongoose from 'mongoose';

export interface IBudget extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  currentSpent: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  alerts: {
    enabled: boolean;
    threshold: number; // percentage
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new mongoose.Schema<IBudget>(
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
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    currentSpent: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    alerts: {
      enabled: {
        type: Boolean,
        default: true,
      },
      threshold: {
        type: Number,
        default: 80, // 80% threshold
        min: 0,
        max: 100,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ category: 1 });
BudgetSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
