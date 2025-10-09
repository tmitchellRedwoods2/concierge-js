import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsuranceClaim from '@/lib/db/models/InsuranceClaim';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const claims = await InsuranceClaim.find({ userId: session.user.id })
      .populate('policyId')
      .sort({ dateOfIncident: -1 });

    return NextResponse.json({ 
      status: 'ok',
      claims
    });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
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
      policyId,
      claimNumber,
      dateOfIncident,
      description,
      status,
      amountClaimed,
      amountApproved,
      notes
    } = body;

    // Create new insurance claim
    const claim = new InsuranceClaim({
      userId: session.user.id,
      policyId,
      claimNumber: claimNumber || `CLM-${Date.now()}`,
      dateOfIncident: new Date(dateOfIncident),
      description,
      status: status || 'SUBMITTED',
      amountClaimed: parseFloat(amountClaimed) || 0,
      amountApproved: parseFloat(amountApproved) || 0,
      notes: notes || ''
    });

    await claim.save();

    return NextResponse.json({ 
      status: 'ok',
      claim,
      message: 'Insurance claim filed successfully'
    });
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
