import mongoose, { Schema } from 'mongoose';
import { AccessMode } from '@/lib/db/models/User';

export interface WorkflowDocument extends mongoose.Document {
  _id: string;
  userId: string;
  name: string;
  description: string;
  trigger: any;
  steps: any[];
  nodes: any[];
  edges: any[];
  approvalRequired: boolean;
  autoExecute: boolean;
  isActive: boolean;
  // Agentic workflow fields
  isAgentic?: boolean; // Marks workflow as agentic (runs automatically without user approval)
  targetAccessMode?: AccessMode[]; // Which access modes this workflow targets (e.g., ['hands-off'])
  autoApprove?: boolean; // Whether actions should be auto-approved (default: true for agentic)
  executionPriority?: number; // Priority for execution (1-10, higher = more important)
  maxRetries?: number; // Maximum retry attempts on failure
  retryDelayMs?: number; // Delay between retries in milliseconds
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<WorkflowDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    trigger: { type: Schema.Types.Mixed, default: {} },
    steps: { type: [Schema.Types.Mixed], default: [] },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    approvalRequired: { type: Boolean, default: false },
    autoExecute: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    // Agentic workflow fields
    isAgentic: { type: Boolean, default: false, index: true },
    targetAccessMode: { 
      type: [String], 
      enum: ['hands-off', 'self-service', 'ai-only'],
      default: [],
      index: true,
    },
    autoApprove: { type: Boolean, default: true },
    executionPriority: { type: Number, default: 5, min: 1, max: 10 },
    maxRetries: { type: Number, default: 3, min: 0 },
    retryDelayMs: { type: Number, default: 5000, min: 0 },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const WorkflowModel =
  (mongoose.models.Workflow as mongoose.Model<WorkflowDocument>) ||
  mongoose.model<WorkflowDocument>('Workflow', WorkflowSchema);

