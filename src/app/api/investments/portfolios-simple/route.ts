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

    await connectToDatabase();
    
    const portfolios = await Portfolio.find({
      userId: session.user.id,
      isActive: true,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      portfolios: portfolios.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        totalValue: p.totalValue,
        totalCost: p.totalCost,
        totalGainLoss: p.totalGainLoss,
        totalGainLossPercent: p.totalGainLossPercent,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
    });
  } catch (error) {
    console.error('Get portfolios error:', error);
    return NextResponse.json(
      { error: 'Failed to get portfolios' },
      { status: 500 }
    );
  }
}
