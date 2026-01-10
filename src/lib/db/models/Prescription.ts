import mongoose, { Schema, Document } from 'mongoose';

export interface IRefillHistory {
  date: Date;
  status: 'requested' | 'processing' | 'ready' | 'picked_up' | 'cancelled' | 'failed';
  pharmacy: string;
  estimatedReady?: Date;
  actualReady?: Date;
  pickedUp?: Date;
  notes?: string;
  pharmacyConfirmationNumber?: string;
  failureReason?: string;
}

export interface IPrescription extends Document {
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribingDoctor: string;
  pharmacy: string;
  refillsRemaining: number;
  isActive: boolean;
  notes?: string;
  
  // Auto-refill settings
  autoRefillEnabled: boolean;
  autoRefillDaysBefore: number; // Days before refill due to trigger auto-refill (default: 7)
  
  // Refill tracking
  lastRefillDate?: Date;
  nextRefillDueDate?: Date;
  refillHistory: IRefillHistory[];
  
  // Pharmacy account info (for API integration)
  pharmacyAccountId?: string;
  pharmacyRxNumber?: string; // Prescription number at pharmacy
  
  // Refill eligibility
  requiresPhysicianApproval: boolean; // Whether this needs doctor approval for refills
  isMaintenanceMedication: boolean; // Typically true for chronic conditions
  
  // Quantity tracking
  quantity: number; // Number of pills/doses per refill
  daysSupply: number; // How many days the quantity lasts (calculated from frequency)
  
  createdAt: Date;
  updatedAt: Date;
}

const RefillHistorySchema = new Schema<IRefillHistory>({
  date: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['requested', 'processing', 'ready', 'picked_up', 'cancelled', 'failed'],
    required: true,
    default: 'requested'
  },
  pharmacy: { type: String, required: true },
  estimatedReady: { type: Date },
  actualReady: { type: Date },
  pickedUp: { type: Date },
  notes: { type: String },
  pharmacyConfirmationNumber: { type: String },
  failureReason: { type: String }
}, { _id: false });

const PrescriptionSchema = new Schema<IPrescription>({
  userId: { type: String, required: true, index: true },
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  prescribingDoctor: { type: String, required: true },
  pharmacy: { type: String, required: true },
  refillsRemaining: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
  
  // Auto-refill settings
  autoRefillEnabled: { type: Boolean, default: false },
  autoRefillDaysBefore: { type: Number, default: 7, min: 1, max: 30 },
  
  // Refill tracking
  lastRefillDate: { type: Date },
  nextRefillDueDate: { type: Date },
  refillHistory: { type: [RefillHistorySchema], default: [] },
  
  // Pharmacy account info
  pharmacyAccountId: { type: String },
  pharmacyRxNumber: { type: String },
  
  // Refill eligibility
  requiresPhysicianApproval: { type: Boolean, default: false },
  isMaintenanceMedication: { type: Boolean, default: true },
  
  // Quantity tracking
  quantity: { type: Number, default: 30 }, // Default 30-day supply
  daysSupply: { type: Number, default: 30 } // Default 30 days
}, {
  timestamps: true
});

// Index for efficient queries
PrescriptionSchema.index({ userId: 1, isActive: 1 });
PrescriptionSchema.index({ userId: 1, nextRefillDueDate: 1 });
PrescriptionSchema.index({ userId: 1, autoRefillEnabled: 1 });

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
