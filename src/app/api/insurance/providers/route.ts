import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsuranceProvider from '@/lib/db/models/InsuranceProvider';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const query = type ? { type } : {};
    const providers = await InsuranceProvider.find(query).sort({ name: 1 });

    return NextResponse.json({ 
      status: 'ok',
      providers
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
