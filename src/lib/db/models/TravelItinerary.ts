import mongoose from 'mongoose';

export interface ITravelItinerary extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  dayNumber: number;
  date: Date;
  
  // Day Information
  title: string;
  description?: string;
  
  // Activities
  activities: Array<{
    time: string;
    title: string;
    description: string;
    location: string;
    duration: number; // in minutes
    cost: number;
    category: 'SIGHTSEEING' | 'DINING' | 'ACTIVITY' | 'TRANSPORTATION' | 'ACCOMMODATION' | 'SHOPPING' | 'RELAXATION' | 'OTHER';
    bookingId?: mongoose.Types.ObjectId;
    confirmationNumber?: string;
    address?: string;
    phone?: string;
    website?: string;
    notes?: string;
    completed: boolean;
  }>;
  
  // Transportation
  transportation?: {
    mode: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    cost: number;
    confirmationNumber?: string;
  };
  
  // Accommodation
  accommodation?: {
    name: string;
    address: string;
    checkIn?: string;
    checkOut?: string;
    confirmationNumber?: string;
  };
  
  // Budget
  estimatedCost: number;
  actualCost: number;
  
  // Additional Details
  weather?: string;
  notes?: string;
  highlights?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TravelItinerarySchema = new mongoose.Schema<ITravelItinerary>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    activities: [{
      time: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      location: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        min: 0,
      },
      cost: {
        type: Number,
        default: 0,
        min: 0,
      },
      category: {
        type: String,
        enum: ['SIGHTSEEING', 'DINING', 'ACTIVITY', 'TRANSPORTATION', 'ACCOMMODATION', 'SHOPPING', 'RELAXATION', 'OTHER'],
        default: 'ACTIVITY',
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TravelBooking',
      },
      confirmationNumber: {
        type: String,
      },
      address: {
        type: String,
      },
      phone: {
        type: String,
      },
      website: {
        type: String,
      },
      notes: {
        type: String,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    }],
    transportation: {
      mode: {
        type: String,
      },
      from: {
        type: String,
      },
      to: {
        type: String,
      },
      departureTime: {
        type: String,
      },
      arrivalTime: {
        type: String,
      },
      cost: {
        type: Number,
        default: 0,
      },
      confirmationNumber: {
        type: String,
      },
    },
    accommodation: {
      name: {
        type: String,
      },
      address: {
        type: String,
      },
      checkIn: {
        type: String,
      },
      checkOut: {
        type: String,
      },
      confirmationNumber: {
        type: String,
      },
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    weather: {
      type: String,
    },
    notes: {
      type: String,
    },
    highlights: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TravelItinerarySchema.index({ userId: 1, tripId: 1, dayNumber: 1 });
TravelItinerarySchema.index({ date: 1 });

export default mongoose.models.TravelItinerary || mongoose.model<ITravelItinerary>('TravelItinerary', TravelItinerarySchema);
