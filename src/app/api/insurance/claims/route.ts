import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsuranceClaim from '@/lib/db/models/InsuranceClaim';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Loading claims for user:', session.user.id);
    await connectToDatabase();
    
    const claims = await InsuranceClaim.find({ userId: session.user.id })
      .sort({ incidentDate: -1 }); // Fixed: should be incidentDate, not dateOfIncident

    console.log('Found claims:', claims.length);
    console.log('Claims data:', claims);

    return NextResponse.json({ 
      status: 'ok',
      claims
    });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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
      incidentDate,
      filingDate,
      description,
      status,
      claimAmount,
      deductibleAmount,
      claimType,
      location,
      notes
    } = body;

    // Generate unique claim number
    const generateUniqueClaimNumber = async () => {
      let uniqueClaimNumber = claimNumber || `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Check if claim number already exists and generate new one if needed
      while (await InsuranceClaim.findOne({ claimNumber: uniqueClaimNumber })) {
        uniqueClaimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }
      
      return uniqueClaimNumber;
    };

    const finalClaimNumber = await generateUniqueClaimNumber();

    // Create new insurance claim
    const claim = new InsuranceClaim({
      userId: session.user.id,
      policyId,
      claimNumber: finalClaimNumber,
      incidentDate: new Date(incidentDate),
      filingDate: new Date(filingDate || new Date()),
      description,
      status: status || 'FILED',
      claimAmount: parseFloat(claimAmount) || 0,
      deductibleAmount: parseFloat(deductibleAmount) || 0,
      claimType: claimType || 'OTHER',
      location: location || '',
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('id');
    
    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    // Find and delete the claim (only if it belongs to the user)
    const claim = await InsuranceClaim.findOneAndDelete({ 
      _id: claimId, 
      userId: session.user.id 
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Insurance claim deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
