import mongoose from 'mongoose';

export interface ILawFirm extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  
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
  
  // Firm Details
  foundedYear?: number;
  numberOfAttorneys?: number;
  specialties: string[];
  practiceAreas: string[];
  
  // Ratings and Reviews
  rating?: number;
  totalReviews?: number;
  averageRating?: number;
  
  // Services and Pricing
  consultationFee?: number;
  hourlyRates?: {
    partner: number;
    associate: number;
    paralegal: number;
  };
  acceptsContingency?: boolean;
  contingencyPercentage?: number;
  
  // Team Information
  attorneys: Array<{
    name: string;
    title: string;
    specialties: string[];
    experience: number;
    education: string[];
    barAdmissions: string[];
    email?: string;
    phone?: string;
    bio?: string;
  }>;
  
  // Availability and Services
  consultationTypes: string[];
  acceptsNewClients: boolean;
  emergencyServices: boolean;
  virtualConsultations: boolean;
  
  // Additional Information
  languages: string[];
  certifications?: string[];
  awards?: string[];
  affiliations?: string[];
  
  // Integration Information
  onlinePortal?: string;
  clientPortal?: string;
  documentSharing?: boolean;
  billingSystem?: string;
  
  // Additional Details
  notes?: string;
  tags?: string[];
  
  // Auto-generated fields
  createdAt: Date;
  updatedAt: Date;
}

const LawFirmSchema = new mongoose.Schema<ILawFirm>(
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
    description: {
      type: String,
    },
    logo: {
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
    foundedYear: {
      type: Number,
    },
    numberOfAttorneys: {
      type: Number,
    },
    specialties: [{
      type: String,
    }],
    practiceAreas: [{
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
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    consultationFee: {
      type: Number,
      min: 0,
    },
    hourlyRates: {
      partner: {
        type: Number,
        min: 0,
      },
      associate: {
        type: Number,
        min: 0,
      },
      paralegal: {
        type: Number,
        min: 0,
      },
    },
    acceptsContingency: {
      type: Boolean,
      default: false,
    },
    contingencyPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    attorneys: [{
      name: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      specialties: [{
        type: String,
      }],
      experience: {
        type: Number,
        min: 0,
      },
      education: [{
        type: String,
      }],
      barAdmissions: [{
        type: String,
      }],
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
      bio: {
        type: String,
      },
    }],
    consultationTypes: [{
      type: String,
    }],
    acceptsNewClients: {
      type: Boolean,
      default: true,
    },
    emergencyServices: {
      type: Boolean,
      default: false,
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
    awards: [{
      type: String,
    }],
    affiliations: [{
      type: String,
    }],
    onlinePortal: {
      type: String,
    },
    clientPortal: {
      type: String,
    },
    documentSharing: {
      type: Boolean,
      default: false,
    },
    billingSystem: {
      type: String,
    },
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
LawFirmSchema.index({ userId: 1 });
LawFirmSchema.index({ specialties: 1 });
LawFirmSchema.index({ practiceAreas: 1 });
LawFirmSchema.index({ 'address.city': 1, 'address.state': 1 });
LawFirmSchema.index({ rating: -1 });

export default mongoose.models.LawFirm || mongoose.model<ILawFirm>('LawFirm', LawFirmSchema);
