import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  try {
    // Test authentication
    const session = await auth();
    const hasAuth = !!session?.user?.id;
    
    // Test database connection
    let hasDatabase = false;
    let dbError = null;
    try {
      await connectToDatabase();
      hasDatabase = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    // Test Yahoo Finance API
    let hasYahooFinance = false;
    let yahooError = null;
    try {
      const yahooFinance = require('yahoo-finance2').default;
      const result = await yahooFinance.quote('AAPL');
      hasYahooFinance = !!result;
    } catch (error) {
      yahooError = error instanceof Error ? error.message : 'Unknown Yahoo Finance error';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasAuth,
        hasDatabase,
        hasYahooFinance,
        userId: session?.user?.id || null,
        databaseError: dbError,
        yahooError: yahooError,
      },
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
