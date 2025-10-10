import mongoose from 'mongoose';

export interface ILegalAppointment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  caseId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  appointmentType: 'CONSULTATION' | 'COURT_HEARING' | 'DEPOSITION' | 'MEDIATION' | 'SETTLEMENT_CONFERENCE' | 'TRIAL' | 'CLIENT_MEETING' | 'PHONE_CALL' | 'VIDEO_CALL' | 'OTHER';
  
  // Scheduling Information
  startDateTime: Date;
  endDateTime: Date;
  duration: number; // in minutes
  timeZone: string;
  
  // Location Information
  location: {
    type: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'COURT';
    address?: string;
    room?: string;
    phoneNumber?: string;
    videoLink?: string;
    courtName?: string;
    courtroom?: string;
  };
  
  // Participants
  attendees: Array<{
    name: string;
    role: 'CLIENT' | 'ATTORNEY' | 'JUDGE' | 'WITNESS' | 'EXPERT' | 'OTHER';
    email?: string;
    phone?: string;
    confirmed: boolean;
    notes?: string;
  }>;
  
  // Status and Reminders
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'NO_SHOW';
  reminderSent: boolean;
  reminderDate?: Date;
  
  // Preparation and Follow-up
  preparationNotes?: string;
  agenda?: string[];
  followUpActions?: Array<{
    action: string;
    assignedTo: string;
    dueDate: Date;
    completed: boolean;
  }>;
  
  // Related Information
  documents?: mongoose.Types.ObjectId[];
  notes?: string;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const LegalAppointmentSchema = new mongoose.Schema<ILegalAppointment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalCase',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    appointmentType: {
      type: String,
      enum: ['CONSULTATION', 'COURT_HEARING', 'DEPOSITION', 'MEDIATION', 'SETTLEMENT_CONFERENCE', 'TRIAL', 'CLIENT_MEETING', 'PHONE_CALL', 'VIDEO_CALL', 'OTHER'],
      required: true,
      index: true,
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    timeZone: {
      type: String,
      default: 'America/New_York',
    },
    location: {
      type: {
        type: String,
        enum: ['IN_PERSON', 'PHONE', 'VIDEO', 'COURT'],
        required: true,
      },
      address: {
        type: String,
      },
      room: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      videoLink: {
        type: String,
      },
      courtName: {
        type: String,
      },
      courtroom: {
        type: String,
      },
    },
    attendees: [{
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['CLIENT', 'ATTORNEY', 'JUDGE', 'WITNESS', 'EXPERT', 'OTHER'],
        required: true,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
      confirmed: {
        type: Boolean,
        default: false,
      },
      notes: {
        type: String,
      },
    }],
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'],
      default: 'SCHEDULED',
      required: true,
      index: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderDate: {
      type: Date,
    },
    preparationNotes: {
      type: String,
    },
    agenda: [{
      type: String,
    }],
    followUpActions: [{
      action: {
        type: String,
        required: true,
      },
      assignedTo: {
        type: String,
        required: true,
      },
      dueDate: {
        type: Date,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    }],
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalDocument',
    }],
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
LegalAppointmentSchema.index({ userId: 1, startDateTime: 1 });
LegalAppointmentSchema.index({ userId: 1, status: 1 });
LegalAppointmentSchema.index({ userId: 1, appointmentType: 1 });
LegalAppointmentSchema.index({ caseId: 1, startDateTime: 1 });
LegalAppointmentSchema.index({ startDateTime: 1 });

export default mongoose.models.LegalAppointment || mongoose.model<ILegalAppointment>('LegalAppointment', LegalAppointmentSchema);
