import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchStocks } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'AAPL';

    console.log('Testing stock search for:', query);

    // Test the search function directly
    const results = await searchStocks(query);
    
    console.log('Search results:', results);

    return NextResponse.json({
      status: 'ok',
      query,
      results,
      resultCount: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test search error:', error);
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
