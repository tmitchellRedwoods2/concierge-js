import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  userId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    email: boolean;
    popup: boolean;
    minutes: number;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  createdBy: string;
  source: 'workflow' | 'manual' | 'import';
  workflowExecutionId?: string;
  googleEventId?: string;
  googleEventUrl?: string;
  appleEventId?: string;
  appleEventUrl?: string;
}

const CalendarEventSchema = new Schema<ICalendarEvent>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String },
  attendees: [{ type: String }],
  reminders: {
    email: { type: Boolean, default: true },
    popup: { type: Boolean, default: true },
    minutes: { type: Number, default: 15 }
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed'
  },
  createdBy: { type: String, required: true },
  source: { 
    type: String, 
    required: true, 
    enum: ['workflow', 'manual', 'import'],
    default: 'manual'
  },
  workflowExecutionId: { type: String },
  googleEventId: { type: String },
  googleEventUrl: { type: String },
  appleEventId: { type: String },
  appleEventUrl: { type: String }
}, {
  timestamps: true
});

// Create indexes for better query performance
CalendarEventSchema.index({ userId: 1, startDate: 1 });
CalendarEventSchema.index({ workflowExecutionId: 1 });
CalendarEventSchema.index({ googleEventId: 1 });

export const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
