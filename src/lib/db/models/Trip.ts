import mongoose from 'mongoose';

export interface ITrip extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tripName: string;
  description?: string;
  
  // Trip Details
  destination: string;
  destinationCity?: string;
  destinationState?: string;
  destinationCountry: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  
  // Trip Type and Status
  tripType: 'LEISURE' | 'BUSINESS' | 'FAMILY' | 'ADVENTURE' | 'ROMANTIC' | 'SOLO' | 'GROUP' | 'OTHER';
  status: 'PLANNING' | 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Travelers
  travelers: Array<{
    name: string;
    relationship: string;
    age?: number;
    passportNumber?: string;
    passportExpiry?: Date;
  }>;
  numberOfTravelers: number;
  
  // Budget
  estimatedBudget: number;
  actualCost: number;
  currency: string;
  
  // Accommodation
  accommodationType?: 'HOTEL' | 'AIRBNB' | 'RESORT' | 'HOSTEL' | 'CAMPING' | 'FAMILY' | 'OTHER';
  
  // Transportation
  transportationMode?: 'FLIGHT' | 'CAR' | 'TRAIN' | 'BUS' | 'CRUISE' | 'OTHER';
  
  // Additional Information
  purpose?: string;
  highlights?: string[];
  notes?: string;
  tags?: string[];
  
  // Weather and Climate
  expectedWeather?: string;
  packingListCompleted: boolean;
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new mongoose.Schema<ITrip>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    destination: {
      type: String,
      required: true,
    },
    destinationCity: {
      type: String,
    },
    destinationState: {
      type: String,
    },
    destinationCountry: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    tripType: {
      type: String,
      enum: ['LEISURE', 'BUSINESS', 'FAMILY', 'ADVENTURE', 'ROMANTIC', 'SOLO', 'GROUP', 'OTHER'],
      default: 'LEISURE',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PLANNING', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING',
      required: true,
      index: true,
    },
    travelers: [{
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      age: {
        type: Number,
      },
      passportNumber: {
        type: String,
      },
      passportExpiry: {
        type: Date,
      },
    }],
    numberOfTravelers: {
      type: Number,
      default: 1,
      min: 1,
    },
    estimatedBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    accommodationType: {
      type: String,
      enum: ['HOTEL', 'AIRBNB', 'RESORT', 'HOSTEL', 'CAMPING', 'FAMILY', 'OTHER'],
    },
    transportationMode: {
      type: String,
      enum: ['FLIGHT', 'CAR', 'TRAIN', 'BUS', 'CRUISE', 'OTHER'],
    },
    purpose: {
      type: String,
    },
    highlights: [{
      type: String,
    }],
    notes: {
      type: String,
    },
    tags: [{
      type: String,
    }],
    expectedWeather: {
      type: String,
    },
    packingListCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TripSchema.index({ userId: 1, startDate: -1 });
TripSchema.index({ userId: 1, status: 1 });
TripSchema.index({ userId: 1, tripType: 1 });
TripSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
