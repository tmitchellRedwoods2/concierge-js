import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Portfolio from '@/lib/db/models/Portfolio';
import Holding from '@/lib/db/models/Holding';
import { calculatePortfolioPerformance } from '@/lib/finance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { id } = await params;
    const portfolio = await Portfolio.findOne({
      _id: id,
      userId: session.user.id,
      isActive: true,
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    const holdings = await Holding.find({ portfolioId: id });
    
    // Calculate portfolio performance
    const performance = calculatePortfolioPerformance(
      holdings.map(h => ({
        shares: h.shares,
        averageCost: h.averageCost,
        currentPrice: h.currentPrice,
      }))
    );

    return NextResponse.json({
      portfolio,
      holdings,
      performance,
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to get portfolio' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    await connectToDatabase();
    
    const { id } = await params;
    const portfolio = await Portfolio.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
      },
      { name, description },
      { new: true }
    );

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio updated successfully',
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { id } = await params;
    const portfolio = await Portfolio.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
      },
      { isActive: false },
      { new: true }
    );

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 }
    );
  }
}
