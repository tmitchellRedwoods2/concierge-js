import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import LawFirm from '@/lib/db/models/LawFirm';

// Sample law firm data for the directory
const SAMPLE_LAW_FIRMS = [
  {
    name: "Smith & Associates",
    description: "Premier personal injury and civil litigation firm with over 30 years of experience",
    logo: "⚖️",
    website: "https://www.smithlawfirm.com",
    phone: "1-800-555-0101",
    email: "contact@smithlawfirm.com",
    address: {
      street: "123 Legal Plaza",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States"
    },
    foundedYear: 1990,
    numberOfAttorneys: 25,
    specialties: ["Personal Injury", "Medical Malpractice", "Workers Compensation"],
    practiceAreas: ["PERSONAL_INJURY", "MEDICAL_MALPRACTICE", "WORKERS_COMP"],
    rating: 4.8,
    totalReviews: 342,
    consultationFee: 0,
    hourlyRates: {
      partner: 500,
      associate: 300,
      paralegal: 150
    },
    acceptsContingency: true,
    contingencyPercentage: 33,
    acceptsNewClients: true,
    emergencyServices: true,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
    isPublic: true
  },
  {
    name: "Johnson Family Law Group",
    description: "Compassionate family law representation for divorce, custody, and adoption",
    logo: "👨‍👩‍👧‍👦",
    website: "https://www.johnsonfamilylaw.com",
    phone: "1-800-555-0102",
    email: "info@johnsonfamilylaw.com",
    address: {
      street: "456 Family Court Rd",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "United States"
    },
    foundedYear: 2005,
    numberOfAttorneys: 12,
    specialties: ["Divorce", "Child Custody", "Adoption", "Prenuptial Agreements"],
    practiceAreas: ["FAMILY_LAW", "DIVORCE", "CHILD_CUSTODY", "ADOPTION"],
    rating: 4.7,
    totalReviews: 218,
    consultationFee: 150,
    hourlyRates: {
      partner: 450,
      associate: 275,
      paralegal: 125
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English"],
    isPublic: true
  },
  {
    name: "Martinez Criminal Defense",
    description: "Aggressive criminal defense with a proven track record of successful outcomes",
    logo: "🛡️",
    website: "https://www.martinezdefense.com",
    phone: "1-800-555-0103",
    email: "defense@martinezdefense.com",
    address: {
      street: "789 Justice Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "United States"
    },
    foundedYear: 2010,
    numberOfAttorneys: 8,
    specialties: ["DUI Defense", "Drug Crimes", "White Collar Crime", "Assault"],
    practiceAreas: ["CRIMINAL", "DUI", "DRUG_CRIMES", "WHITE_COLLAR"],
    rating: 4.9,
    totalReviews: 156,
    consultationFee: 0,
    hourlyRates: {
      partner: 600,
      associate: 350,
      paralegal: 175
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: true,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
    isPublic: true
  },
  {
    name: "Thompson Business Law",
    description: "Strategic business counsel for startups, contracts, and corporate transactions",
    logo: "🏢",
    website: "https://www.thompsonbizlaw.com",
    phone: "1-800-555-0104",
    email: "counsel@thompsonbizlaw.com",
    address: {
      street: "321 Corporate Blvd",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "United States"
    },
    foundedYear: 2000,
    numberOfAttorneys: 35,
    specialties: ["Business Formation", "Contracts", "Mergers & Acquisitions", "Intellectual Property"],
    practiceAreas: ["BUSINESS", "CORPORATE", "CONTRACTS", "IP"],
    rating: 4.6,
    totalReviews: 289,
    consultationFee: 250,
    hourlyRates: {
      partner: 700,
      associate: 400,
      paralegal: 200
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English", "Mandarin"],
    isPublic: true
  },
  {
    name: "Wilson Estate Planning",
    description: "Comprehensive estate planning, wills, trusts, and probate services",
    logo: "📜",
    website: "https://www.wilsonestate.com",
    phone: "1-800-555-0105",
    email: "planning@wilsonestate.com",
    address: {
      street: "555 Heritage Lane",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      country: "United States"
    },
    foundedYear: 1985,
    numberOfAttorneys: 15,
    specialties: ["Wills", "Trusts", "Probate", "Elder Law"],
    practiceAreas: ["ESTATE_PLANNING", "PROBATE", "ELDER_LAW", "TRUSTS"],
    rating: 4.8,
    totalReviews: 412,
    consultationFee: 200,
    hourlyRates: {
      partner: 550,
      associate: 325,
      paralegal: 150
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English"],
    isPublic: true
  },
  {
    name: "Garcia Immigration Law",
    description: "Dedicated immigration attorneys helping families navigate the immigration process",
    logo: "🌍",
    website: "https://www.garciaimmigration.com",
    phone: "1-800-555-0106",
    email: "help@garciaimmigration.com",
    address: {
      street: "888 Border St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "United States"
    },
    foundedYear: 2012,
    numberOfAttorneys: 10,
    specialties: ["Green Cards", "Citizenship", "Deportation Defense", "Work Visas"],
    practiceAreas: ["IMMIGRATION", "DEPORTATION", "CITIZENSHIP", "VISAS"],
    rating: 4.9,
    totalReviews: 567,
    consultationFee: 100,
    hourlyRates: {
      partner: 400,
      associate: 250,
      paralegal: 125
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: true,
    virtualConsultations: true,
    languages: ["English", "Spanish", "Portuguese"],
    isPublic: true
  },
  {
    name: "Anderson Real Estate Law",
    description: "Expert real estate attorneys for residential and commercial transactions",
    logo: "🏠",
    website: "https://www.andersonrealestate.com",
    phone: "1-800-555-0107",
    email: "realestate@andersonlaw.com",
    address: {
      street: "999 Property Plaza",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      country: "United States"
    },
    foundedYear: 1995,
    numberOfAttorneys: 18,
    specialties: ["Real Estate Transactions", "Property Disputes", "Landlord-Tenant", "Zoning"],
    practiceAreas: ["REAL_ESTATE", "PROPERTY", "LANDLORD_TENANT", "ZONING"],
    rating: 4.7,
    totalReviews: 234,
    consultationFee: 175,
    hourlyRates: {
      partner: 475,
      associate: 300,
      paralegal: 140
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English"],
    isPublic: true
  },
  {
    name: "Lee Employment Law Firm",
    description: "Fighting for employee rights in discrimination, harassment, and wrongful termination cases",
    logo: "💼",
    website: "https://www.leeemploymentlaw.com",
    phone: "1-800-555-0108",
    email: "rights@leeemploymentlaw.com",
    address: {
      street: "777 Worker Rights Way",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "United States"
    },
    foundedYear: 2008,
    numberOfAttorneys: 14,
    specialties: ["Wrongful Termination", "Discrimination", "Harassment", "Wage Disputes"],
    practiceAreas: ["EMPLOYMENT", "DISCRIMINATION", "WRONGFUL_TERMINATION", "WAGE_HOUR"],
    rating: 4.8,
    totalReviews: 298,
    consultationFee: 0,
    hourlyRates: {
      partner: 525,
      associate: 325,
      paralegal: 160
    },
    acceptsContingency: true,
    contingencyPercentage: 40,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English", "Korean"],
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
    
    // Get user's saved law firms
    const userFirms = await LawFirm.find({ userId: session.user.id })
      .sort({ name: 1 });

    // Combine with sample firms for the directory
    const allFirms = [...userFirms, ...SAMPLE_LAW_FIRMS];

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const minRating = searchParams.get('minRating');
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    let filteredFirms = allFirms;

    // Apply filters
    if (search) {
      filteredFirms = filteredFirms.filter(firm => 
        firm.name.toLowerCase().includes(search.toLowerCase()) ||
        firm.description.toLowerCase().includes(search.toLowerCase()) ||
        firm.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (specialty) {
      filteredFirms = filteredFirms.filter(firm => 
        firm.specialties?.some((s: string) => s.toLowerCase().includes(specialty.toLowerCase())) ||
        firm.practiceAreas?.includes(specialty)
      );
    }

    if (minRating) {
      filteredFirms = filteredFirms.filter(firm => 
        firm.rating >= parseFloat(minRating)
      );
    }

    if (city) {
      filteredFirms = filteredFirms.filter(firm => 
        firm.address?.city.toLowerCase() === city.toLowerCase()
      );
    }

    if (state) {
      filteredFirms = filteredFirms.filter(firm => 
        firm.address?.state.toLowerCase() === state.toLowerCase()
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      firms: filteredFirms,
      totalFirms: allFirms.length,
      filteredCount: filteredFirms.length
    });
  } catch (error) {
    console.error('Error fetching law firms:', error);
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

    // Create new law firm
    const firm = new LawFirm({
      userId: session.user.id,
      ...body
    });

    await firm.save();

    return NextResponse.json({ 
      status: 'ok',
      firm,
      message: 'Law firm added successfully'
    });
  } catch (error) {
    console.error('Error creating law firm:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
