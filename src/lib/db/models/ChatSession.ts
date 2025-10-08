import mongoose from 'mongoose';

export interface IChatSession extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  title: string;
  agentType: 'financial' | 'health' | 'travel' | 'legal' | 'tax' | 'general';
  isActive: boolean;
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new mongoose.Schema<IChatSession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    agentType: {
      type: String,
      enum: ['financial', 'health', 'travel', 'legal', 'tax', 'general'],
      default: 'general',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ChatSessionSchema.index({ userId: 1, isActive: 1, lastMessageAt: -1 });

export default mongoose.models.ChatSession ||
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

