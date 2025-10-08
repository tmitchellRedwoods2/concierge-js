import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Watchlist from '@/lib/db/models/Watchlist';
import { getStockQuote } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const watchlist = await Watchlist.find({
      userId: session.user.id,
    }).sort({ addedDate: -1 });

    // Get current quotes for watchlist items
    const watchlistWithQuotes = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const quote = await getStockQuote(item.symbol);
          return {
            ...item.toObject(),
            currentPrice: quote?.price || 0,
            change: quote?.change || 0,
            changePercent: quote?.changePercent || 0,
          };
        } catch (error) {
          console.error(`Error getting quote for ${item.symbol}:`, error);
          return {
            ...item.toObject(),
            currentPrice: 0,
            change: 0,
            changePercent: 0,
          };
        }
      })
    );

    return NextResponse.json({ watchlist: watchlistWithQuotes });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get watchlist' },
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

    const { symbol, targetPrice, notes } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Get stock name
    const quote = await getStockQuote(symbol);
    const stockName = quote?.name || symbol;

    // Check if already in watchlist
    const existing = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 400 }
      );
    }

    const watchlistItem = new Watchlist({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      name: stockName,
      targetPrice,
      notes,
    });

    await watchlistItem.save();
    
    return NextResponse.json({
      success: true,
      watchlistItem,
      message: 'Added to watchlist successfully',
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const result = await Watchlist.findOneAndDelete({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist successfully',
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
