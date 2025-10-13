import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: 'financial' | 'investment' | 'insurance' | 'health' | 'travel' | 'legal' | 'tax' | 'general';
  metadata?: {
    tokens?: number;
    model?: string;
    cost?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>(
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
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    agentType: {
      type: String,
      enum: ['financial', 'investment', 'insurance', 'health', 'travel', 'legal', 'tax', 'general'],
      default: 'general',
    },
    metadata: {
      tokens: Number,
      model: String,
      cost: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
MessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

