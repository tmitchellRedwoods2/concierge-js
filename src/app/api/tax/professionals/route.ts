import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import TaxProfessional from '@/lib/db/models/TaxProfessional';

// Sample tax professional data for the directory - Real firms for reference
const SAMPLE_TAX_PROFESSIONALS = [
  {
    name: "H&R Block",
    firmName: "H&R Block",
    description: "America's largest tax preparation company with over 12,000 locations nationwide",
    logo: "📊",
    credentials: ["EA", "CPA"],
    ptin: "P00000001",
    website: "https://www.hrblock.com",
    phone: "1-800-HRBLOCK",
    email: "info@hrblock.com",
    address: {
      street: "One H&R Block Way",
      city: "Kansas City",
      state: "MO",
      zipCode: "64105",
      country: "United States"
    },
    yearsExperience: 68,
    specialties: ["Individual Tax Returns", "Small Business", "Tax Planning", "Audit Support"],
    servicesOffered: ["Tax Preparation", "Tax Planning", "Audit Assistance", "Prior Year Returns"],
    rating: 4.3,
    totalReviews: 45230,
    consultationFee: 0,
    hourlyRate: 150,
    flatFeeServices: [
      { service: "Simple 1040", price: 89 },
      { service: "Itemized Deductions", price: 199 },
      { service: "Small Business", price: 299 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
    certifications: ["IRS Enrolled Agent", "Certified Public Accountant"],
    affiliations: ["AICPA", "NAEA"],
    isPublic: true
  },
  {
    name: "Jackson Hewitt",
    firmName: "Jackson Hewitt Tax Service",
    description: "Trusted tax preparation with guaranteed maximum refund and 100% accuracy",
    logo: "💼",
    credentials: ["EA", "CPA"],
    ptin: "P00000002",
    website: "https://www.jacksonhewitt.com",
    phone: "1-800-234-1040",
    email: "support@jacksonhewitt.com",
    address: {
      street: "3 Sylvan Way",
      city: "Parsippany",
      state: "NJ",
      zipCode: "07054",
      country: "United States"
    },
    yearsExperience: 42,
    specialties: ["Tax Preparation", "Refund Advance", "Small Business", "Self-Employed"],
    servicesOffered: ["Tax Filing", "Tax Planning", "Bookkeeping", "Payroll Services"],
    rating: 4.2,
    totalReviews: 28450,
    consultationFee: 0,
    hourlyRate: 140,
    flatFeeServices: [
      { service: "Basic Return", price: 79 },
      { service: "Standard Return", price: 189 },
      { service: "Complex Return", price: 279 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
    certifications: ["IRS Enrolled Agent"],
    affiliations: ["NAEA"],
    isPublic: true
  },
  {
    name: "Liberty Tax",
    firmName: "Liberty Tax Service",
    description: "Professional tax preparation with a focus on maximizing your refund",
    logo: "🗽",
    credentials: ["EA", "CPA"],
    ptin: "P00000003",
    website: "https://www.libertytax.com",
    phone: "1-877-at-Liberty",
    email: "info@libertytax.com",
    address: {
      street: "1716 Corporate Landing Parkway",
      city: "Virginia Beach",
      state: "VA",
      zipCode: "23454",
      country: "United States"
    },
    yearsExperience: 25,
    specialties: ["Individual Returns", "Business Returns", "Tax Resolution", "Bookkeeping"],
    servicesOffered: ["Tax Preparation", "Business Services", "Tax Resolution", "Year-Round Support"],
    rating: 4.1,
    totalReviews: 15670,
    consultationFee: 0,
    hourlyRate: 135,
    flatFeeServices: [
      { service: "Simple 1040", price: 85 },
      { service: "Itemized Return", price: 175 },
      { service: "Business Return", price: 350 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English"],
    certifications: ["IRS Enrolled Agent", "CPA"],
    affiliations: ["AICPA"],
    isPublic: true
  },
  {
    name: "TurboTax Live",
    firmName: "Intuit TurboTax",
    description: "Online tax preparation with live CPA and EA support on demand",
    logo: "💻",
    credentials: ["CPA", "EA"],
    ptin: "P00000004",
    website: "https://turbotax.intuit.com/personal-taxes/online/live/",
    phone: "1-800-446-8848",
    email: "support@turbotax.com",
    address: {
      street: "2632 Marine Way",
      city: "Mountain View",
      state: "CA",
      zipCode: "94043",
      country: "United States"
    },
    yearsExperience: 30,
    specialties: ["Online Filing", "Live CPA Support", "Self-Employed", "Investments"],
    servicesOffered: ["DIY Tax Software", "Live Tax Advice", "Full Service Preparation", "Audit Support"],
    rating: 4.5,
    totalReviews: 89340,
    consultationFee: 0,
    hourlyRate: 0,
    flatFeeServices: [
      { service: "Deluxe", price: 69 },
      { service: "Premier", price: 99 },
      { service: "Self-Employed", price: 119 },
      { service: "Live Full Service", price: 199 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English", "Spanish"],
    certifications: ["CPA", "Enrolled Agent"],
    affiliations: ["AICPA", "NAEA"],
    isPublic: true
  },
  {
    name: "Padgett Business Services",
    firmName: "Padgett Business Services",
    description: "Small business tax and accounting specialists serving entrepreneurs nationwide",
    logo: "🏢",
    credentials: ["CPA", "EA"],
    ptin: "P00000005",
    website: "https://www.padgettbusinessservices.com",
    phone: "1-800-323-7292",
    email: "info@padgettbusinessservices.com",
    address: {
      street: "160 Hawthorne Park",
      city: "Athens",
      state: "GA",
      zipCode: "30606",
      country: "United States"
    },
    yearsExperience: 55,
    specialties: ["Small Business", "Bookkeeping", "Payroll", "Business Tax Returns"],
    servicesOffered: ["Tax Preparation", "Bookkeeping", "Payroll Services", "Business Consulting"],
    rating: 4.6,
    totalReviews: 8920,
    consultationFee: 0,
    hourlyRate: 175,
    flatFeeServices: [
      { service: "Individual Return", price: 150 },
      { service: "S-Corp Return", price: 450 },
      { service: "Partnership Return", price: 550 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English"],
    certifications: ["CPA", "Enrolled Agent"],
    affiliations: ["AICPA", "NAEA", "NSBA"],
    isPublic: true
  },
  {
    name: "Kaufman Rossin",
    firmName: "Kaufman Rossin",
    description: "Top 100 CPA firm providing comprehensive tax and advisory services",
    logo: "⚖️",
    credentials: ["CPA"],
    ptin: "P00000006",
    website: "https://www.kaufmanrossin.com",
    phone: "1-305-858-5600",
    email: "info@kaufmanrossin.com",
    address: {
      street: "2699 S Bayshore Drive",
      city: "Miami",
      state: "FL",
      zipCode: "33133",
      country: "United States"
    },
    yearsExperience: 57,
    specialties: ["Corporate Tax", "International Tax", "Estate Planning", "High Net Worth"],
    servicesOffered: ["Tax Planning", "Tax Compliance", "Estate & Trust", "International Tax"],
    rating: 4.8,
    totalReviews: 1240,
    consultationFee: 250,
    hourlyRate: 350,
    flatFeeServices: [],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English", "Spanish", "Portuguese"],
    certifications: ["CPA"],
    affiliations: ["AICPA", "FICPA"],
    isPublic: true
  },
  {
    name: "Moss Adams",
    firmName: "Moss Adams LLP",
    description: "Leading accounting and consulting firm serving middle-market companies",
    logo: "🌲",
    credentials: ["CPA"],
    ptin: "P00000007",
    website: "https://www.mossadams.com",
    phone: "1-206-302-6500",
    email: "info@mossadams.com",
    address: {
      street: "999 Third Avenue",
      city: "Seattle",
      state: "WA",
      zipCode: "98104",
      country: "United States"
    },
    yearsExperience: 111,
    specialties: ["Corporate Tax", "M&A Tax", "State & Local Tax", "R&D Tax Credits"],
    servicesOffered: ["Tax Compliance", "Tax Planning", "Transaction Advisory", "Credits & Incentives"],
    rating: 4.7,
    totalReviews: 2340,
    consultationFee: 300,
    hourlyRate: 400,
    flatFeeServices: [],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English"],
    certifications: ["CPA"],
    affiliations: ["AICPA"],
    isPublic: true
  },
  {
    name: "TaxAct Professional",
    firmName: "TaxAct",
    description: "Affordable online tax software with professional support options",
    logo: "💡",
    credentials: ["EA"],
    ptin: "P00000008",
    website: "https://www.taxact.com",
    phone: "1-319-373-3600",
    email: "support@taxact.com",
    address: {
      street: "1425 60th Street NE",
      city: "Cedar Rapids",
      state: "IA",
      zipCode: "52402",
      country: "United States"
    },
    yearsExperience: 25,
    specialties: ["Online Filing", "Self-Employed", "Investments", "Rental Property"],
    servicesOffered: ["DIY Tax Software", "Professional Review", "Prior Year Returns", "Audit Assistance"],
    rating: 4.4,
    totalReviews: 34560,
    consultationFee: 0,
    hourlyRate: 0,
    flatFeeServices: [
      { service: "Deluxe", price: 25 },
      { service: "Premier", price: 40 },
      { service: "Self-Employed", price: 65 }
    ],
    acceptsNewClients: true,
    virtualConsultations: true,
    languages: ["English"],
    certifications: ["Enrolled Agent"],
    affiliations: ["NAEA"],
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
    
    // Get user's saved tax professionals
    const userProfessionals = await TaxProfessional.find({ userId: session.user.id })
      .sort({ name: 1 });

    // Combine with sample professionals for the directory
    const allProfessionals = [...userProfessionals, ...SAMPLE_TAX_PROFESSIONALS];

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const minRating = searchParams.get('minRating');

    let filteredProfessionals = allProfessionals;

    // Apply filters
    if (search) {
      filteredProfessionals = filteredProfessionals.filter(prof => 
        prof.name.toLowerCase().includes(search.toLowerCase()) ||
        prof.description.toLowerCase().includes(search.toLowerCase()) ||
        prof.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (specialty) {
      filteredProfessionals = filteredProfessionals.filter(prof => 
        prof.specialties?.some((s: string) => s.toLowerCase().includes(specialty.toLowerCase()))
      );
    }

    if (minRating) {
      filteredProfessionals = filteredProfessionals.filter(prof => 
        prof.rating >= parseFloat(minRating)
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      professionals: filteredProfessionals,
      totalProfessionals: allProfessionals.length,
      filteredCount: filteredProfessionals.length
    });
  } catch (error) {
    console.error('Error fetching tax professionals:', error);
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

    // Create new tax professional
    const professional = new TaxProfessional({
      userId: session.user.id,
      ...body
    });

    await professional.save();

    return NextResponse.json({ 
      status: 'ok',
      professional,
      message: 'Tax professional added successfully'
    });
  } catch (error) {
    console.error('Error creating tax professional:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
