import mongoose, { Schema, Document } from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
}

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
}, {
  timestamps: true
});

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
