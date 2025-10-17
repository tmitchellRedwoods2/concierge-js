import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InvestmentTransaction from '@/lib/db/models/InvestmentTransaction';

export async function GET(request: NextRequest) {
  try {
    console.log('Transactions API: Starting request');
    const session = await auth();
    console.log('Transactions API: Session check', { hasSession: !!session, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.log('Transactions API: Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Transactions API: Connecting to database');
    await connectToDatabase();
    console.log('Transactions API: Database connected');
    
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    console.log('Transactions API: Portfolio ID', portfolioId);

    if (!portfolioId) {
      console.log('Transactions API: Missing portfolio ID');
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    console.log('Transactions API: Querying transactions for portfolio', portfolioId);
    const transactions = await InvestmentTransaction.find({ portfolioId })
      .sort({ date: -1 });
    console.log('Transactions API: Found transactions', transactions.length);

    return NextResponse.json({ 
      status: 'ok',
      transactions,
      count: transactions.length 
    });
  } catch (error) {
    console.error('Transactions API: Error fetching transactions:', error);
    console.error('Transactions API: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
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
      portfolioId,
      holdingId,
      symbol,
      shares,
      price,
      transactionType,
      date,
      notes
    } = body;

    // Create new transaction
    const transaction = new InvestmentTransaction({
      portfolioId,
      holdingId,
      symbol: symbol.toUpperCase(),
      shares: parseFloat(shares),
      price: parseFloat(price),
      transactionType: transactionType.toUpperCase(),
      date: new Date(date),
      notes: notes || ''
    });

    await transaction.save();

    return NextResponse.json({ 
      status: 'ok',
      transaction,
      message: 'Transaction added successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
