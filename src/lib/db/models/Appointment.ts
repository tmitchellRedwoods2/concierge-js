import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userId: string;
  doctorName: string;
  specialty: string;
  appointmentType: string;
  appointmentDate: Date;
  appointmentTime: string;
  location: string;
  address: string;
  phoneNumber: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  userId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  appointmentType: { type: String, required: true },
  appointmentDate: { type: Date, required: true, index: true },
  appointmentTime: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  notes: { type: String },
  reminderSent: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
