import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthProvider extends Document {
  name: string;
  specialty: string;
  type: 'doctor' | 'specialist' | 'clinic' | 'hospital' | 'pharmacy';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  acceptsInsurance: boolean;
  isInNetwork: boolean;
  languages: string[];
  availability: string;
  createdAt: Date;
  updatedAt: Date;
}

const HealthProviderSchema = new Schema<IHealthProvider>({
  name: { type: String, required: true, index: true },
  specialty: { type: String, required: true, index: true },
  type: { type: String, enum: ['doctor', 'specialist', 'clinic', 'hospital', 'pharmacy'], required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  zipCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  website: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  acceptsInsurance: { type: Boolean, default: true },
  isInNetwork: { type: Boolean, default: true },
  languages: [{ type: String }],
  availability: { type: String, default: 'Monday-Friday 9AM-5PM' },
}, {
  timestamps: true
});

export default mongoose.models.HealthProvider || mongoose.model<IHealthProvider>('HealthProvider', HealthProviderSchema);
