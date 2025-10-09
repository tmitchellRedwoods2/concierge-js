import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStockQuote } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Yahoo Finance API...');
    
    // Test AAPL quote
    const quote = await getStockQuote('AAPL');
    console.log('AAPL quote result:', quote);
    
    return NextResponse.json({
      status: 'ok',
      testSymbol: 'AAPL',
      quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test Yahoo Finance error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
