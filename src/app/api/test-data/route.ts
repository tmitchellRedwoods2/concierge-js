import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Portfolio from '@/lib/db/models/Portfolio';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test database connection and data fetching
    await connectToDatabase();
    
    const portfolios = await Portfolio.find({
      userId: session.user.id,
      isActive: true,
    });

    return NextResponse.json({
      status: 'ok',
      userId: session.user.id,
      portfolioCount: portfolios.length,
      portfolios: portfolios.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        totalValue: p.totalValue,
        createdAt: p.createdAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test data error:', error);
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
