import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InvestmentTransaction from '@/lib/db/models/InvestmentTransaction';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    const transactions = await InvestmentTransaction.find({ portfolioId })
      .sort({ date: -1 })
      .populate('holdingId');

    return NextResponse.json({ 
      status: 'ok',
      transactions,
      count: transactions.length 
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
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
