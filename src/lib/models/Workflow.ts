import mongoose, { Schema } from 'mongoose';

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
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const WorkflowModel =
  (mongoose.models.Workflow as mongoose.Model<WorkflowDocument>) ||
  mongoose.model<WorkflowDocument>('Workflow', WorkflowSchema);

