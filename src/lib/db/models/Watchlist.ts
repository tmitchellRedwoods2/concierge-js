import mongoose from 'mongoose';

export interface IWatchlist extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  targetPrice?: number;
  notes?: string;
  addedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistSchema = new mongoose.Schema<IWatchlist>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    targetPrice: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying and uniqueness
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });
WatchlistSchema.index({ userId: 1, addedDate: -1 });

export default mongoose.models.Watchlist || mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);
