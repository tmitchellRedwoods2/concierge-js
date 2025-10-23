import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: string;
  calendarPreferences: {
    primaryProvider: 'internal' | 'google' | 'outlook' | 'apple' | 'caldav';
    syncEnabled: boolean;
    syncDirection: 'internal-to-external' | 'external-to-internal' | 'bidirectional';
    externalCalendarId?: string;
    externalCalendarName?: string;
    appleCalendarConfig?: {
      serverUrl: string;
      username: string;
      password: string;
      calendarPath: string;
    };
    syncSettings: {
      autoSync: boolean;
      syncInterval: number; // minutes
      syncOnCreate: boolean;
      syncOnUpdate: boolean;
      syncOnDelete: boolean;
    };
  };
  notificationPreferences: {
    emailReminders: boolean;
    pushReminders: boolean;
    reminderTime: number; // minutes before event
  };
  displayPreferences: {
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStart: 'sunday' | 'monday';
  };
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: { type: String, required: true, unique: true },
  calendarPreferences: {
    primaryProvider: { 
      type: String, 
      enum: ['internal', 'google', 'outlook', 'apple', 'caldav'],
      default: 'internal'
    },
    syncEnabled: { type: Boolean, default: false },
    syncDirection: { 
      type: String, 
      enum: ['internal-to-external', 'external-to-internal', 'bidirectional'],
      default: 'internal-to-external'
    },
    externalCalendarId: { type: String },
    externalCalendarName: { type: String },
    syncSettings: {
      autoSync: { type: Boolean, default: true },
      syncInterval: { type: Number, default: 15 }, // 15 minutes
      syncOnCreate: { type: Boolean, default: true },
      syncOnUpdate: { type: Boolean, default: true },
      syncOnDelete: { type: Boolean, default: true }
    }
  },
  notificationPreferences: {
    emailReminders: { type: Boolean, default: true },
    pushReminders: { type: Boolean, default: true },
    reminderTime: { type: Number, default: 15 } // 15 minutes before
  },
  displayPreferences: {
    timezone: { type: String, default: 'America/Los_Angeles' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    weekStart: { type: String, enum: ['sunday', 'monday'], default: 'sunday' }
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
UserPreferencesSchema.index({ userId: 1 });

export const UserPreferences = mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
