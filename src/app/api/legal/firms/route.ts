import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import LawFirm from '@/lib/db/models/LawFirm';

// Sample law firm data for the directory - Real firms for reference
const SAMPLE_LAW_FIRMS = [
  {
    name: "Morgan & Morgan",
    description: "America's largest personal injury law firm with over 800 attorneys nationwide",
    logo: "⚖️",
    website: "https://www.forthepeople.com",
    phone: "1-800-THE-FIRM",
    email: "contact@forthepeople.com",
    address: {
      street: "20 N Orange Ave",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      country: "United States"
    },
    foundedYear: 1988,
    numberOfAttorneys: 800,
    specialties: ["Personal Injury", "Medical Malpractice", "Car Accidents", "Workers Compensation"],
    practiceAreas: ["PERSONAL_INJURY", "MEDICAL_MALPRACTICE", "AUTO_ACCIDENTS", "WORKERS_COMP"],
    rating: 4.7,
    totalReviews: 15420,
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
    name: "Cordell & Cordell",
    description: "Nationwide family law firm focusing on men's divorce and fathers' rights",
    logo: "👨‍👩‍👧‍👦",
    website: "https://www.cordellcordell.com",
    phone: "1-866-DADS-LAW",
    email: "info@cordellcordell.com",
    address: {
      street: "1501 S Hanley Rd",
      city: "St. Louis",
      state: "MO",
      zipCode: "63144",
      country: "United States"
    },
    foundedYear: 1990,
    numberOfAttorneys: 150,
    specialties: ["Divorce", "Child Custody", "Child Support", "Fathers' Rights"],
    practiceAreas: ["FAMILY_LAW", "DIVORCE", "CHILD_CUSTODY", "FATHERS_RIGHTS"],
    rating: 4.6,
    totalReviews: 8920,
    consultationFee: 0,
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
    name: "Spodek Law Group",
    description: "Elite criminal defense attorneys handling high-profile federal and state cases",
    logo: "🛡️",
    website: "https://www.spodeklawgroup.com",
    phone: "1-212-300-5196",
    email: "info@spodeklawgroup.com",
    address: {
      street: "570 Lexington Ave",
      city: "New York",
      state: "NY",
      zipCode: "10022",
      country: "United States"
    },
    foundedYear: 2008,
    numberOfAttorneys: 25,
    specialties: ["Federal Crimes", "White Collar Crime", "DUI Defense", "Drug Crimes"],
    practiceAreas: ["CRIMINAL", "FEDERAL", "WHITE_COLLAR", "DUI"],
    rating: 4.9,
    totalReviews: 1256,
    consultationFee: 0,
    hourlyRates: {
      partner: 750,
      associate: 450,
      paralegal: 200
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: true,
    virtualConsultations: true,
    languages: ["English", "Spanish", "Russian"],
    isPublic: true
  },
  {
    name: "Cooley LLP",
    description: "Global law firm serving innovative companies and investors with business-critical needs",
    logo: "🏢",
    website: "https://www.cooley.com",
    phone: "1-650-843-5000",
    email: "info@cooley.com",
    address: {
      street: "3175 Hanover St",
      city: "Palo Alto",
      state: "CA",
      zipCode: "94304",
      country: "United States"
    },
    foundedYear: 1920,
    numberOfAttorneys: 1600,
    specialties: ["Corporate Law", "Venture Capital", "M&A", "Intellectual Property"],
    practiceAreas: ["BUSINESS", "CORPORATE", "VENTURE_CAPITAL", "IP"],
    rating: 4.8,
    totalReviews: 2340,
    consultationFee: 500,
    hourlyRates: {
      partner: 1200,
      associate: 700,
      paralegal: 300
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English", "Mandarin", "Japanese"],
    isPublic: true
  },
  {
    name: "Gassman, Crotty & Denicolo",
    description: "Florida's premier estate planning and asset protection law firm",
    logo: "📜",
    website: "https://www.gassmanpa.com",
    phone: "1-727-442-1200",
    email: "agassman@gassmanpa.com",
    address: {
      street: "9700 113th St",
      city: "Clearwater",
      state: "FL",
      zipCode: "33773",
      country: "United States"
    },
    foundedYear: 1987,
    numberOfAttorneys: 12,
    specialties: ["Estate Planning", "Asset Protection", "Elder Law", "Special Needs Trusts"],
    practiceAreas: ["ESTATE_PLANNING", "ASSET_PROTECTION", "ELDER_LAW", "TRUSTS"],
    rating: 4.9,
    totalReviews: 876,
    consultationFee: 250,
    hourlyRates: {
      partner: 600,
      associate: 350,
      paralegal: 175
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English"],
    isPublic: true
  },
  {
    name: "Fragomen",
    description: "World's leading immigration law firm serving global corporations and individuals",
    logo: "🌍",
    website: "https://www.fragomen.com",
    phone: "1-212-688-8811",
    email: "info@fragomen.com",
    address: {
      street: "7 Hanover Square",
      city: "New York",
      state: "NY",
      zipCode: "10004",
      country: "United States"
    },
    foundedYear: 1951,
    numberOfAttorneys: 4500,
    specialties: ["Corporate Immigration", "Employment Visas", "Green Cards", "Citizenship"],
    practiceAreas: ["IMMIGRATION", "EMPLOYMENT_VISAS", "CORPORATE", "CITIZENSHIP"],
    rating: 4.7,
    totalReviews: 5670,
    consultationFee: 300,
    hourlyRates: {
      partner: 650,
      associate: 400,
      paralegal: 200
    },
    acceptsContingency: false,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English", "Spanish", "Mandarin", "Hindi"],
    isPublic: true
  },
  {
    name: "Rosen Law Firm",
    description: "National real estate law firm specializing in complex commercial transactions",
    logo: "🏠",
    website: "https://www.rosenlegal.com",
    phone: "1-212-686-1060",
    email: "info@rosenlegal.com",
    address: {
      street: "275 Madison Ave",
      city: "New York",
      state: "NY",
      zipCode: "10016",
      country: "United States"
    },
    foundedYear: 1989,
    numberOfAttorneys: 45,
    specialties: ["Commercial Real Estate", "Securities Law", "Shareholder Rights", "Class Actions"],
    practiceAreas: ["REAL_ESTATE", "SECURITIES", "COMMERCIAL", "CLASS_ACTION"],
    rating: 4.6,
    totalReviews: 1890,
    consultationFee: 0,
    hourlyRates: {
      partner: 800,
      associate: 475,
      paralegal: 225
    },
    acceptsContingency: true,
    contingencyPercentage: 25,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English"],
    isPublic: true
  },
  {
    name: "Sanford Heisler Sharp",
    description: "Leading employment and civil rights law firm fighting workplace discrimination",
    logo: "💼",
    website: "https://www.sanfordheisler.com",
    phone: "1-202-499-5200",
    email: "info@sanfordheisler.com",
    address: {
      street: "1350 Avenue of the Americas",
      city: "New York",
      state: "NY",
      zipCode: "10019",
      country: "United States"
    },
    foundedYear: 2004,
    numberOfAttorneys: 85,
    specialties: ["Employment Discrimination", "Sexual Harassment", "Wage & Hour", "Whistleblower"],
    practiceAreas: ["EMPLOYMENT", "DISCRIMINATION", "CIVIL_RIGHTS", "WHISTLEBLOWER"],
    rating: 4.8,
    totalReviews: 2340,
    consultationFee: 0,
    hourlyRates: {
      partner: 700,
      associate: 425,
      paralegal: 200
    },
    acceptsContingency: true,
    contingencyPercentage: 40,
    acceptsNewClients: true,
    emergencyServices: false,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
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
