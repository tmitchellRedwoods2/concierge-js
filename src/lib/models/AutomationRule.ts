import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationRule extends Document {
  userId: string;
  name: string;
  description: string;
  trigger: {
    type: 'schedule' | 'email' | 'sms' | 'calendar_event' | 'webhook' | 'time_based';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
    delay?: number;
  }>;
  enabled: boolean;
  executionCount: number;
  lastExecuted?: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRule>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  trigger: {
    type: {
      type: String,
      required: true,
      enum: ['schedule', 'email', 'sms', 'calendar_event', 'webhook', 'time_based']
    },
    conditions: { type: Schema.Types.Mixed, required: true }
  },
  actions: [{
    type: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    delay: { type: Number }
  }],
  enabled: { type: Boolean, default: true },
  executionCount: { type: Number, default: 0 },
  lastExecuted: { type: Date }
}, {
  timestamps: true
});

// Create indexes for better query performance
AutomationRuleSchema.index({ userId: 1, enabled: 1 });
AutomationRuleSchema.index({ 'trigger.type': 1 });

export const AutomationRule = mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);

