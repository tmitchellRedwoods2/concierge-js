import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStockQuote } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Alpha Vantage API...');
    console.log('API Key exists:', !!process.env.ALPHA_VANTAGE_API_KEY);
    console.log('API Key length:', process.env.ALPHA_VANTAGE_API_KEY?.length || 0);
    
    // Test AAPL quote
    const quote = await getStockQuote('AAPL');
    console.log('AAPL quote result:', quote);
    
    return NextResponse.json({
      status: 'ok',
      testSymbol: 'AAPL',
      hasApiKey: !!process.env.ALPHA_VANTAGE_API_KEY,
      apiKeyLength: process.env.ALPHA_VANTAGE_API_KEY?.length || 0,
      quote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test Alpha Vantage error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        hasApiKey: !!process.env.ALPHA_VANTAGE_API_KEY,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
