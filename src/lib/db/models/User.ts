/**
 * User model for MongoDB
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  plan: 'basic' | 'premium' | 'elite';
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

// Export a function to get the model to avoid initialization issues
let UserModel: any = null;

export default function getUser() {
  if (!UserModel) {
    UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
  }
  return UserModel;
}

