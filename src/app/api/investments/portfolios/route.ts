import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Portfolio from '@/lib/db/models/Portfolio';
import Holding from '@/lib/db/models/Holding';
import { calculatePortfolioPerformance } from '@/lib/finance';

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

    // Get holdings for each portfolio
    const portfoliosWithHoldings = await Promise.all(
      portfolios.map(async (portfolio) => {
        const holdings = await Holding.find({ portfolioId: portfolio._id });
        return {
          ...portfolio.toObject(),
          holdings,
        };
      })
    );

    return NextResponse.json({ portfolios: portfoliosWithHoldings });
  } catch (error) {
    console.error('Get portfolios error:', error);
    return NextResponse.json(
      { error: 'Failed to get portfolios' },
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const portfolio = new Portfolio({
      userId: session.user.id,
      name,
      description,
    });

    await portfolio.save();
    
    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio created successfully',
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}
