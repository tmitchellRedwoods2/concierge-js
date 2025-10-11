import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import HealthProvider from '@/lib/db/models/HealthProvider';

// Sample healthcare providers data
const SAMPLE_PROVIDERS = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Internal Medicine",
    type: "doctor",
    address: "123 Medical Plaza",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    phoneNumber: "(415) 555-0123",
    email: "sarah.johnson@healthcare.com",
    website: "https://drjohnson.healthcare.com",
    rating: 4.8,
    reviewCount: 127,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "Monday-Friday 8AM-6PM"
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    type: "specialist",
    address: "456 Heart Center",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    phoneNumber: "(415) 555-0456",
    email: "michael.chen@cardiology.com",
    website: "https://drchen.cardiology.com",
    rating: 4.9,
    reviewCount: 89,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Mandarin"],
    availability: "Monday-Friday 9AM-5PM"
  },
  {
    name: "Dr. Emily Rodriguez",
    specialty: "Dermatology",
    type: "specialist",
    address: "789 Skin Care Center",
    city: "San Francisco",
    state: "CA",
    zipCode: "94104",
    phoneNumber: "(415) 555-0789",
    email: "emily.rodriguez@dermatology.com",
    website: "https://dremily.dermatology.com",
    rating: 4.7,
    reviewCount: 156,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "Monday-Friday 8AM-5PM, Saturday 9AM-2PM"
  },
  {
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    type: "specialist",
    address: "321 Sports Medicine Center",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    phoneNumber: "(415) 555-0321",
    email: "james.wilson@orthopedics.com",
    website: "https://drwilson.orthopedics.com",
    rating: 4.6,
    reviewCount: 203,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English"],
    availability: "Monday-Friday 7AM-6PM"
  },
  {
    name: "Dr. Lisa Park",
    specialty: "Pediatrics",
    type: "doctor",
    address: "654 Children's Hospital",
    city: "San Francisco",
    state: "CA",
    zipCode: "94106",
    phoneNumber: "(415) 555-0654",
    email: "lisa.park@pediatrics.com",
    website: "https://drpark.pediatrics.com",
    rating: 4.9,
    reviewCount: 178,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Korean"],
    availability: "Monday-Friday 8AM-5PM"
  },
  {
    name: "CVS Pharmacy",
    specialty: "Pharmacy",
    type: "pharmacy",
    address: "987 Main Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    phoneNumber: "(415) 555-0987",
    email: "store987@cvs.com",
    website: "https://cvs.com",
    rating: 4.3,
    reviewCount: 89,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish", "Chinese"],
    availability: "24/7"
  },
  {
    name: "Walgreens Pharmacy",
    specialty: "Pharmacy",
    type: "pharmacy",
    address: "147 Health Plaza",
    city: "San Francisco",
    state: "CA",
    zipCode: "94108",
    phoneNumber: "(415) 555-0147",
    email: "store147@walgreens.com",
    website: "https://walgreens.com",
    rating: 4.4,
    reviewCount: 67,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "24/7"
  },
  {
    name: "Kaiser Permanente Medical Center",
    specialty: "General Medicine",
    type: "hospital",
    address: "258 Hospital Drive",
    city: "San Francisco",
    state: "CA",
    zipCode: "94109",
    phoneNumber: "(415) 555-0258",
    email: "info@kp.org",
    website: "https://kp.org",
    rating: 4.5,
    reviewCount: 312,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish", "Chinese", "Vietnamese"],
    availability: "24/7 Emergency, Monday-Friday 8AM-8PM"
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    
    // Check if we have any providers in the database
    let providers = await HealthProvider.find({});
    
    // If no providers in database, seed with sample data
    if (providers.length === 0) {
      providers = await HealthProvider.insertMany(SAMPLE_PROVIDERS);
    }
    
    // Apply filters
    let query: any = {};
    if (specialty) query.specialty = { $regex: specialty, $options: 'i' };
    if (type) query.type = type;
    if (city) query.city = { $regex: city, $options: 'i' };
    
    if (Object.keys(query).length > 0) {
      providers = await HealthProvider.find(query);
    }
    
    // Sort by rating (highest first)
    providers.sort((a, b) => b.rating - a.rating);

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching health providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health providers' },
      { status: 500 }
    );
  }
}
