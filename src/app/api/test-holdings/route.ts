import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Holding from '@/lib/db/models/Holding';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get all holdings for user
    const holdings = await Holding.find({}).sort({ symbol: 1 });

    return NextResponse.json({
      status: 'ok',
      holdingsCount: holdings.length,
      holdings: holdings.map(h => ({
        id: h._id,
        symbol: h.symbol,
        name: h.name,
        shares: h.shares,
        averageCost: h.averageCost,
        totalCost: h.totalCost,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        gainLoss: h.gainLoss,
        gainLossPercent: h.gainLossPercent,
        lastUpdated: h.lastUpdated,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test holdings error:', error);
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
