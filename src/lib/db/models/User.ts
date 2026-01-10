/**
 * User model for MongoDB
 */
import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'client' | 'admin' | 'agent';
export type AccessMode = 'hands-off' | 'self-service' | 'ai-only';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  plan: 'basic' | 'premium' | 'elite';
  role: UserRole;
  accessMode?: AccessMode; // Only for 'client' role
  netWorth?: number;
  annualIncome?: number;
  goals?: string[];
  selectedServices?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'premium', 'elite'],
      default: 'basic',
    },
    role: {
      type: String,
      enum: ['client', 'admin', 'agent'],
      default: 'client',
      required: true,
    },
    accessMode: {
      type: String,
      enum: ['hands-off', 'self-service', 'ai-only'],
      required: false,
      // Only applicable for 'client' role
      validate: {
        validator: function(this: IUser, value: AccessMode | undefined) {
          // accessMode only applies to clients
          if (this.role === 'client') {
            // For clients, accessMode is required (default will be set in pre-save hook)
            return value !== undefined;
          }
          // For non-clients, accessMode must be undefined
          return value === undefined;
        },
        message: 'accessMode is only applicable for client role',
      },
    },
    netWorth: {
      type: Number,
      min: 0,
    },
    annualIncome: {
      type: Number,
      min: 0,
    },
    goals: [{
      type: String,
    }],
    selectedServices: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set default accessMode for clients
UserSchema.pre('save', function(next) {
  // Set default accessMode for clients if not provided
  if (this.role === 'client' && !this.accessMode) {
    this.accessMode = 'self-service';
  }
  // Ensure accessMode is undefined for non-clients
  if (this.role !== 'client') {
    this.accessMode = undefined;
  }
  next();
});

// Export a function to get the model to avoid initialization issues
let UserModel: any = null;

export default function getUser() {
  if (!UserModel) {
    UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
  }
  return UserModel;
}

