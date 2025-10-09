import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Dividend from '@/lib/db/models/Dividend';

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

    const dividends = await Dividend.find({ 
      userId: session.user.id,
      portfolioId 
    })
      .sort({ payDate: -1 })
      .populate('holdingId');

    // Calculate summary statistics
    const totalReceived = dividends
      .filter(d => d.status === 'PAID')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalDeclared = dividends
      .filter(d => d.status === 'DECLARED')
      .reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({ 
      status: 'ok',
      dividends,
      summary: {
        totalReceived,
        totalDeclared,
        count: dividends.length,
        paidCount: dividends.filter(d => d.status === 'PAID').length
      }
    });
  } catch (error) {
    console.error('Error fetching dividends:', error);
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
      amount,
      shares,
      dividendPerShare,
      exDate,
      recordDate,
      payDate,
      status = 'DECLARED',
      type = 'REGULAR',
      notes
    } = body;

    // Create new dividend record
    const dividend = new Dividend({
      userId: session.user.id,
      portfolioId,
      holdingId,
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      shares: parseFloat(shares),
      dividendPerShare: parseFloat(dividendPerShare),
      exDate: new Date(exDate),
      recordDate: new Date(recordDate),
      payDate: new Date(payDate),
      status,
      type,
      notes: notes || ''
    });

    await dividend.save();

    return NextResponse.json({ 
      status: 'ok',
      dividend,
      message: 'Dividend record added successfully'
    });
  } catch (error) {
    console.error('Error creating dividend record:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
