import mongoose from 'mongoose';

export interface ITaxProfessional extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  firmName?: string;
  description?: string;
  logo?: string;
  
  // Credentials
  credentials: string[]; // CPA, EA, Tax Attorney, etc.
  ptin: string; // Preparer Tax Identification Number
  licenseNumber?: string;
  licenseState?: string;
  
  // Contact Information
  website?: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Professional Details
  yearsExperience?: number;
  specialties: string[];
  servicesOffered: string[];
  
  // Ratings and Reviews
  rating?: number;
  totalReviews?: number;
  
  // Pricing
  consultationFee?: number;
  hourlyRate?: number;
  flatFeeServices?: Array<{
    service: string;
    price: number;
  }>;
  
  // Availability
  acceptsNewClients: boolean;
  virtualConsultations: boolean;
  languages: string[];
  
  // Additional Information
  certifications?: string[];
  affiliations?: string[];
  
  // Additional Details
  notes?: string;
  tags?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const TaxProfessionalSchema = new mongoose.Schema<ITaxProfessional>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    firmName: {
      type: String,
    },
    description: {
      type: String,
    },
    logo: {
      type: String,
    },
    credentials: [{
      type: String,
    }],
    ptin: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
    },
    licenseState: {
      type: String,
    },
    website: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'United States',
      },
    },
    yearsExperience: {
      type: Number,
      min: 0,
    },
    specialties: [{
      type: String,
    }],
    servicesOffered: [{
      type: String,
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    flatFeeServices: [{
      service: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    acceptsNewClients: {
      type: Boolean,
      default: true,
    },
    virtualConsultations: {
      type: Boolean,
      default: false,
    },
    languages: [{
      type: String,
    }],
    certifications: [{
      type: String,
    }],
    affiliations: [{
      type: String,
    }],
    notes: {
      type: String,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
TaxProfessionalSchema.index({ userId: 1 });
TaxProfessionalSchema.index({ specialties: 1 });
TaxProfessionalSchema.index({ 'address.city': 1, 'address.state': 1 });
TaxProfessionalSchema.index({ rating: -1 });

export default mongoose.models.TaxProfessional || mongoose.model<ITaxProfessional>('TaxProfessional', TaxProfessionalSchema);
