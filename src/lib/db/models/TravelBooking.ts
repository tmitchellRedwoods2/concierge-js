import mongoose from 'mongoose';

export interface ITravelBooking extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  bookingType: 'FLIGHT' | 'HOTEL' | 'CAR_RENTAL' | 'ACTIVITY' | 'RESTAURANT' | 'TRAIN' | 'BUS' | 'CRUISE' | 'OTHER';
  
  // Booking Information
  confirmationNumber: string;
  bookingDate: Date;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  
  // Provider Information
  providerName: string;
  providerPhone?: string;
  providerEmail?: string;
  providerWebsite?: string;
  
  // Flight Details
  flightNumber?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: Date;
  arrivalTime?: Date;
  seatNumber?: string;
  
  // Hotel Details
  hotelName?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  roomType?: string;
  numberOfRooms?: number;
  address?: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  
  // Car Rental Details
  carRentalCompany?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: Date;
  dropoffDate?: Date;
  
  // Activity/Restaurant Details
  activityName?: string;
  activityDate?: Date;
  activityTime?: string;
  location?: string;
  numberOfGuests?: number;
  
  // Financial Information
  cost: number;
  currency: string;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'PARTIAL';
  paymentMethod?: string;
  
  // Cancellation Policy
  cancellationPolicy?: string;
  refundable: boolean;
  cancellationDeadline?: Date;
  
  // Additional Details
  notes?: string;
  attachments?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TravelBookingSchema = new mongoose.Schema<ITravelBooking>(
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
    bookingType: {
      type: String,
      enum: ['FLIGHT', 'HOTEL', 'CAR_RENTAL', 'ACTIVITY', 'RESTAURANT', 'TRAIN', 'BUS', 'CRUISE', 'OTHER'],
      required: true,
      index: true,
    },
    confirmationNumber: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
      required: true,
      index: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    providerPhone: {
      type: String,
    },
    providerEmail: {
      type: String,
    },
    providerWebsite: {
      type: String,
    },
    flightNumber: {
      type: String,
    },
    airline: {
      type: String,
    },
    departureAirport: {
      type: String,
    },
    arrivalAirport: {
      type: String,
    },
    departureTime: {
      type: Date,
    },
    arrivalTime: {
      type: Date,
    },
    seatNumber: {
      type: String,
    },
    hotelName: {
      type: String,
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
    },
    roomType: {
      type: String,
    },
    numberOfRooms: {
      type: Number,
      min: 1,
    },
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    carRentalCompany: {
      type: String,
    },
    vehicleType: {
      type: String,
    },
    pickupLocation: {
      type: String,
    },
    dropoffLocation: {
      type: String,
    },
    pickupDate: {
      type: Date,
    },
    dropoffDate: {
      type: Date,
    },
    activityName: {
      type: String,
    },
    activityDate: {
      type: Date,
    },
    activityTime: {
      type: String,
    },
    location: {
      type: String,
    },
    numberOfGuests: {
      type: Number,
      min: 1,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'REFUNDED', 'PARTIAL'],
      default: 'PAID',
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    cancellationPolicy: {
      type: String,
    },
    refundable: {
      type: Boolean,
      default: false,
    },
    cancellationDeadline: {
      type: Date,
    },
    notes: {
      type: String,
    },
    attachments: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TravelBookingSchema.index({ userId: 1, tripId: 1 });
TravelBookingSchema.index({ userId: 1, bookingType: 1 });
TravelBookingSchema.index({ userId: 1, status: 1 });
TravelBookingSchema.index({ departureTime: 1 });
TravelBookingSchema.index({ checkInDate: 1 });

export default mongoose.models.TravelBooking || mongoose.model<ITravelBooking>('TravelBooking', TravelBookingSchema);
