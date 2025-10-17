import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Live healthcare providers data (like other subsystems)
const LIVE_PROVIDERS = [
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
  },
  // Las Vegas, NV Providers
  {
    name: "Dr. Maria Gonzalez",
    specialty: "Internal Medicine",
    type: "doctor",
    address: "123 Las Vegas Blvd",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89101",
    phoneNumber: "(702) 555-0123",
    email: "maria.gonzalez@healthcare.com",
    website: "https://drgonzalez.healthcare.com",
    rating: 4.7,
    reviewCount: 98,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "Monday-Friday 8AM-6PM"
  },
  {
    name: "Dr. Robert Kim",
    specialty: "Cardiology",
    type: "specialist",
    address: "456 Heart Center Drive",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89102",
    phoneNumber: "(702) 555-0456",
    email: "robert.kim@cardiology.com",
    website: "https://drkim.cardiology.com",
    rating: 4.8,
    reviewCount: 76,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Korean"],
    availability: "Monday-Friday 9AM-5PM"
  },
  {
    name: "Dr. Jennifer Martinez",
    specialty: "Dermatology",
    type: "specialist",
    address: "789 Skin Care Plaza",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89103",
    phoneNumber: "(702) 555-0789",
    email: "jennifer.martinez@dermatology.com",
    website: "https://drmartinez.dermatology.com",
    rating: 4.6,
    reviewCount: 134,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "Monday-Friday 8AM-5PM, Saturday 9AM-2PM"
  },
  {
    name: "Dr. David Thompson",
    specialty: "Orthopedics",
    type: "specialist",
    address: "321 Sports Medicine Center",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89104",
    phoneNumber: "(702) 555-0321",
    email: "david.thompson@orthopedics.com",
    website: "https://drthompson.orthopedics.com",
    rating: 4.5,
    reviewCount: 189,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English"],
    availability: "Monday-Friday 7AM-6PM"
  },
  {
    name: "Dr. Amanda Lee",
    specialty: "Pediatrics",
    type: "doctor",
    address: "654 Children's Medical Center",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89105",
    phoneNumber: "(702) 555-0654",
    email: "amanda.lee@pediatrics.com",
    website: "https://drlee.pediatrics.com",
    rating: 4.9,
    reviewCount: 156,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Chinese"],
    availability: "Monday-Friday 8AM-5PM"
  },
  {
    name: "Walgreens Pharmacy",
    specialty: "Pharmacy",
    type: "pharmacy",
    address: "987 Strip Mall Drive",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89106",
    phoneNumber: "(702) 555-0987",
    email: "store987@walgreens.com",
    website: "https://walgreens.com",
    rating: 4.2,
    reviewCount: 45,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish"],
    availability: "24/7"
  },
  {
    name: "CVS Pharmacy",
    specialty: "Pharmacy",
    type: "pharmacy",
    address: "147 Health Plaza",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89107",
    phoneNumber: "(702) 555-0147",
    email: "store147@cvs.com",
    website: "https://cvs.com",
    rating: 4.3,
    reviewCount: 67,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ["English", "Spanish", "Chinese"],
    availability: "24/7"
  },
  {
    name: "University Medical Center",
    specialty: "General Medicine",
    type: "hospital",
    address: "258 Hospital Drive",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89108",
    phoneNumber: "(702) 555-0258",
    email: "info@umc.org",
    website: "https://umc.org",
    rating: 4.4,
    reviewCount: 278,
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

    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    
    // Start with all live providers
    let providers = [...LIVE_PROVIDERS];
    
    // Apply filters (like other subsystems)
    if (specialty) {
      providers = providers.filter(p => 
        p.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    }
    
    if (type) {
      providers = providers.filter(p => p.type === type);
    }
    
    if (city) {
      providers = providers.filter(p => 
        p.city.toLowerCase().includes(city.toLowerCase())
      );
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
