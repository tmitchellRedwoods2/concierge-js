import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStockQuote, getMultipleQuotes } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');

    if (symbols) {
      // Multiple symbols
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      const quotes = await getMultipleQuotes(symbolList);
      return NextResponse.json({ quotes });
    } else if (symbol) {
      // Single symbol
      const quote = await getStockQuote(symbol.toUpperCase());
      if (!quote) {
        return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
      }
      return NextResponse.json({ quote });
    } else {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
