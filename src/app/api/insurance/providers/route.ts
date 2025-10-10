import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsuranceProvider from '@/lib/db/models/InsuranceProvider';

// Sample provider data for the directory
const SAMPLE_PROVIDERS = [
  {
    name: "State Farm",
    description: "America's largest auto insurer with comprehensive coverage options",
    logo: "🏛️",
    website: "https://www.statefarm.com",
    phone: "1-800-STATE-FARM",
    specialties: ["AUTO", "HOME", "LIFE", "HEALTH"],
    rating: 4.2,
    founded: 1922,
    headquarters: "Bloomington, IL",
    coverageStates: "All 50 states",
    averageRating: 4.2,
    totalReviews: 15420,
    isPublic: true
  },
  {
    name: "Geico",
    description: "Low-cost auto insurance with excellent customer service",
    logo: "🦎",
    website: "https://www.geico.com",
    phone: "1-800-841-3000",
    specialties: ["AUTO", "HOME", "MOTORCYCLE", "RENTERS"],
    rating: 4.1,
    founded: 1936,
    headquarters: "Chevy Chase, MD",
    coverageStates: "All 50 states",
    averageRating: 4.1,
    totalReviews: 12850,
    isPublic: true
  },
  {
    name: "Progressive",
    description: "Innovative insurance solutions with competitive rates",
    logo: "🚀",
    website: "https://www.progressive.com",
    phone: "1-800-PROGRESSIVE",
    specialties: ["AUTO", "HOME", "BUSINESS", "COMMERCIAL"],
    rating: 4.0,
    founded: 1937,
    headquarters: "Mayfield Village, OH",
    coverageStates: "All 50 states",
    averageRating: 4.0,
    totalReviews: 9870,
    isPublic: true
  },
  {
    name: "Allstate",
    description: "You're in good hands with comprehensive protection",
    logo: "✋",
    website: "https://www.allstate.com",
    phone: "1-800-ALLSTATE",
    specialties: ["AUTO", "HOME", "LIFE", "BUSINESS"],
    rating: 4.3,
    founded: 1931,
    headquarters: "Northbrook, IL",
    coverageStates: "All 50 states",
    averageRating: 4.3,
    totalReviews: 11200,
    isPublic: true
  },
  {
    name: "USAA",
    description: "Serving military members and their families",
    logo: "🇺🇸",
    website: "https://www.usaa.com",
    phone: "1-800-531-USAA",
    specialties: ["AUTO", "HOME", "LIFE", "HEALTH"],
    rating: 4.7,
    founded: 1922,
    headquarters: "San Antonio, TX",
    coverageStates: "All 50 states",
    averageRating: 4.7,
    totalReviews: 8950,
    isPublic: false,
    eligibilityNote: "Military members, veterans, and their families only"
  },
  {
    name: "Liberty Mutual",
    description: "Customizable coverage with personalized service",
    logo: "🛡️",
    website: "https://www.libertymutual.com",
    phone: "1-800-837-5254",
    specialties: ["AUTO", "HOME", "LIFE", "BUSINESS"],
    rating: 4.1,
    founded: 1912,
    headquarters: "Boston, MA",
    coverageStates: "All 50 states",
    averageRating: 4.1,
    totalReviews: 7650,
    isPublic: true
  },
  {
    name: "Farmers Insurance",
    description: "Comprehensive insurance with local agent support",
    logo: "🌾",
    website: "https://www.farmers.com",
    phone: "1-800-FARMERS",
    specialties: ["AUTO", "HOME", "LIFE", "BUSINESS"],
    rating: 4.0,
    founded: 1928,
    headquarters: "Woodland Hills, CA",
    coverageStates: "All 50 states",
    averageRating: 4.0,
    totalReviews: 5430,
    isPublic: true
  },
  {
    name: "Nationwide",
    description: "On your side with nationwide coverage",
    logo: "🏢",
    website: "https://www.nationwide.com",
    phone: "1-800-421-3535",
    specialties: ["AUTO", "HOME", "LIFE", "BUSINESS"],
    rating: 4.2,
    founded: 1926,
    headquarters: "Columbus, OH",
    coverageStates: "All 50 states",
    averageRating: 4.2,
    totalReviews: 6890,
    isPublic: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user's saved providers
    const userProviders = await InsuranceProvider.find({ userId: session.user.id })
      .sort({ name: 1 });

    // Combine with sample providers for the directory
    const allProviders = [...userProviders, ...SAMPLE_PROVIDERS];

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const minRating = searchParams.get('minRating');

    let filteredProviders = allProviders;

    // Apply filters
    if (search) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.specialties?.includes(specialty)
      );
    }

    if (minRating) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.rating >= parseFloat(minRating)
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      providers: filteredProviders,
      totalProviders: allProviders.length,
      filteredCount: filteredProviders.length
    });
  } catch (error) {
    console.error('Error fetching insurance providers:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await request.json();
    const {
      name,
      type,
      phone,
      email,
      website,
      address,
      rating,
      foundedYear,
      headquarters,
      description,
      customerServiceHours,
      claimsPhone,
      claimsEmail,
      onlinePortal,
      specialties,
      coverageStates,
      notes
    } = body;

    // Create new insurance provider
    const provider = new InsuranceProvider({
      userId: session.user.id,
      name,
      type,
      phone,
      email,
      website,
      address,
      rating,
      foundedYear,
      headquarters,
      description,
      customerServiceHours,
      claimsPhone,
      claimsEmail,
      onlinePortal,
      specialties: specialties || [],
      coverageStates: coverageStates || [],
      notes: notes || ''
    });

    await provider.save();

    return NextResponse.json({ 
      status: 'ok',
      provider,
      message: 'Insurance provider added successfully'
    });
  } catch (error) {
    console.error('Error creating insurance provider:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}