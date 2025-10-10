import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsuranceClaim from '@/lib/db/models/InsuranceClaim';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST CLAIMS ENDPOINT START ===');
    
    const session = await auth();
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.user.id);
    console.log('Attempting database connection...');
    
    await connectToDatabase();
    console.log('Database connected successfully');

    console.log('Attempting to find claims...');
    const claims = await InsuranceClaim.find({ userId: session.user.id });
    console.log('Raw claims found:', claims.length);
    console.log('Claims data:', JSON.stringify(claims, null, 2));

    return NextResponse.json({ 
      status: 'ok',
      userId: session.user.id,
      claimsCount: claims.length,
      claims: claims
    });
  } catch (error) {
    console.error('=== TEST CLAIMS ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
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
