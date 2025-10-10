import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';

// Sample travel provider data for the directory - Real companies
const SAMPLE_TRAVEL_PROVIDERS = [
  // Airlines
  {
    name: "United Airlines",
    description: "Major American airline with extensive domestic and international routes",
    logo: "✈️",
    category: "AIRLINE",
    website: "https://www.united.com",
    phone: "1-800-864-8331",
    rating: 4.1,
    totalReviews: 45230,
    services: ["Domestic Flights", "International Flights", "MileagePlus Rewards", "Premium Cabins"],
    destinations: "350+ destinations worldwide",
    founded: 1926,
    headquarters: "Chicago, IL",
    isPublic: true
  },
  {
    name: "Delta Air Lines",
    description: "Premium airline with award-winning service and SkyMiles loyalty program",
    logo: "✈️",
    category: "AIRLINE",
    website: "https://www.delta.com",
    phone: "1-800-221-1212",
    rating: 4.3,
    totalReviews: 52340,
    services: ["Domestic Flights", "International Flights", "SkyMiles", "Delta One"],
    destinations: "325+ destinations worldwide",
    founded: 1924,
    headquarters: "Atlanta, GA",
    isPublic: true
  },
  {
    name: "American Airlines",
    description: "World's largest airline by fleet size and revenue",
    logo: "✈️",
    category: "AIRLINE",
    website: "https://www.aa.com",
    phone: "1-800-433-7300",
    rating: 4.0,
    totalReviews: 48920,
    services: ["Domestic Flights", "International Flights", "AAdvantage", "Flagship Service"],
    destinations: "350+ destinations worldwide",
    founded: 1930,
    headquarters: "Fort Worth, TX",
    isPublic: true
  },
  {
    name: "Southwest Airlines",
    description: "Low-cost carrier with no change fees and free checked bags",
    logo: "✈️",
    category: "AIRLINE",
    website: "https://www.southwest.com",
    phone: "1-800-435-9792",
    rating: 4.4,
    totalReviews: 38450,
    services: ["Domestic Flights", "Rapid Rewards", "Free Checked Bags", "No Change Fees"],
    destinations: "100+ destinations in US and nearby",
    founded: 1967,
    headquarters: "Dallas, TX",
    isPublic: true
  },
  // Hotels
  {
    name: "Marriott International",
    description: "World's largest hotel chain with 30 brands and 8,000+ properties",
    logo: "🏨",
    category: "HOTEL",
    website: "https://www.marriott.com",
    phone: "1-800-627-7468",
    rating: 4.5,
    totalReviews: 89340,
    services: ["Hotels & Resorts", "Marriott Bonvoy", "Luxury Properties", "Extended Stay"],
    destinations: "139 countries worldwide",
    founded: 1927,
    headquarters: "Bethesda, MD",
    isPublic: true
  },
  {
    name: "Hilton Hotels & Resorts",
    description: "Global hospitality company with 18 brands and exceptional service",
    logo: "🏨",
    category: "HOTEL",
    website: "https://www.hilton.com",
    phone: "1-800-445-8667",
    rating: 4.4,
    totalReviews: 76540,
    services: ["Hotels & Resorts", "Hilton Honors", "Luxury Collection", "All-Inclusive"],
    destinations: "119 countries worldwide",
    founded: 1919,
    headquarters: "McLean, VA",
    isPublic: true
  },
  {
    name: "Hyatt Hotels",
    description: "Premium hotel brand focused on care and personalized service",
    logo: "🏨",
    category: "HOTEL",
    website: "https://www.hyatt.com",
    phone: "1-800-233-1234",
    rating: 4.6,
    totalReviews: 45670,
    services: ["Hotels & Resorts", "World of Hyatt", "Luxury Properties", "Wellness Resorts"],
    destinations: "70+ countries worldwide",
    founded: 1957,
    headquarters: "Chicago, IL",
    isPublic: true
  },
  {
    name: "IHG Hotels & Resorts",
    description: "Global hotel company with brands like Holiday Inn and InterContinental",
    logo: "🏨",
    category: "HOTEL",
    website: "https://www.ihg.com",
    phone: "1-877-834-3613",
    rating: 4.2,
    totalReviews: 34560,
    services: ["Multiple Brands", "IHG Rewards", "Business Hotels", "Vacation Resorts"],
    destinations: "100+ countries worldwide",
    founded: 2003,
    headquarters: "Denham, UK",
    isPublic: true
  },
  // Car Rentals
  {
    name: "Enterprise Rent-A-Car",
    description: "America's largest car rental company with neighborhood locations",
    logo: "🚗",
    category: "CAR_RENTAL",
    website: "https://www.enterprise.com",
    phone: "1-855-266-9565",
    rating: 4.3,
    totalReviews: 28920,
    services: ["Car Rental", "Truck Rental", "Exotic Cars", "Long-term Rental"],
    destinations: "85+ countries worldwide",
    founded: 1957,
    headquarters: "St. Louis, MO",
    isPublic: true
  },
  {
    name: "Hertz",
    description: "Global car rental leader with premium vehicles and services",
    logo: "🚗",
    category: "CAR_RENTAL",
    website: "https://www.hertz.com",
    phone: "1-800-654-3131",
    rating: 4.1,
    totalReviews: 32450,
    services: ["Car Rental", "Hertz Gold Plus Rewards", "Luxury Cars", "Electric Vehicles"],
    destinations: "150+ countries worldwide",
    founded: 1918,
    headquarters: "Estero, FL",
    isPublic: true
  },
  {
    name: "Avis",
    description: "Trusted car rental with Avis Preferred loyalty program",
    logo: "🚗",
    category: "CAR_RENTAL",
    website: "https://www.avis.com",
    phone: "1-800-633-3469",
    rating: 4.2,
    totalReviews: 24680,
    services: ["Car Rental", "Avis Preferred", "Business Rentals", "One-Way Rentals"],
    destinations: "165+ countries worldwide",
    founded: 1946,
    headquarters: "Parsippany, NJ",
    isPublic: true
  },
  {
    name: "Budget Rent a Car",
    description: "Affordable car rental with great value and convenient locations",
    logo: "🚗",
    category: "CAR_RENTAL",
    website: "https://www.budget.com",
    phone: "1-800-218-7992",
    rating: 4.0,
    totalReviews: 19870,
    services: ["Car Rental", "Budget Fastbreak", "Economy Cars", "SUV Rentals"],
    destinations: "120+ countries worldwide",
    founded: 1958,
    headquarters: "Parsippany, NJ",
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
    
    const providers = SAMPLE_TRAVEL_PROVIDERS;

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const minRating = searchParams.get('minRating');

    let filteredProviders = providers;

    // Apply filters
    if (search) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.category === category
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
      totalProviders: providers.length,
      filteredCount: filteredProviders.length
    });
  } catch (error) {
    console.error('Error fetching travel providers:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
