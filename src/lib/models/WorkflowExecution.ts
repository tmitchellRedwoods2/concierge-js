import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowExecution extends Document {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  startTime: string;
  endTime?: string;
  steps: Array<{
    id: string;
    type: string;
    status: string;
    result?: any;
  }>;
  triggerData: any;
  result: {
    appointmentId?: string;
    status?: string;
    eventUrl?: string;
    error?: string;
  };
  calendarEvent?: {
    eventId: string;
    eventUrl: string;
  } | null;
  error?: string;
  userId: string;
}

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>({
  id: { type: String, required: true, unique: true },
  workflowId: { type: String, required: true },
  workflowName: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['running', 'completed', 'failed', 'timeout'] 
  },
  startTime: { type: String, required: true },
  endTime: { type: String },
  steps: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    result: { type: Schema.Types.Mixed }
  }],
  triggerData: { type: Schema.Types.Mixed },
  result: {
    appointmentId: { type: String },
    status: { type: String },
    eventUrl: { type: String },
    error: { type: String }
  },
  calendarEvent: {
    eventId: { type: String },
    eventUrl: { type: String }
  },
  error: { type: String },
  userId: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes for better query performance
WorkflowExecutionSchema.index({ userId: 1, startTime: -1 });
WorkflowExecutionSchema.index({ workflowId: 1, userId: 1 });
WorkflowExecutionSchema.index({ status: 1, userId: 1 });

export const WorkflowExecution = mongoose.models.WorkflowExecution || mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
