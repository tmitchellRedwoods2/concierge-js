import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Holding from '@/lib/db/models/Holding';
import Portfolio from '@/lib/db/models/Portfolio';
import InvestmentTransaction from '@/lib/db/models/InvestmentTransaction';
import { getStockQuote } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    await connectToDatabase();
    
    let query: any = {};
    if (portfolioId) {
      // Verify portfolio belongs to user
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: session.user.id,
        isActive: true,
      });
      
      if (!portfolio) {
        return NextResponse.json(
          { error: 'Portfolio not found' },
          { status: 404 }
        );
      }
      
      query.portfolioId = portfolioId;
    } else {
      // Get all portfolios for user
      const portfolios = await Portfolio.find({
        userId: session.user.id,
        isActive: true,
      });
      
      query.portfolioId = { $in: portfolios.map(p => p._id) };
    }

    const holdings = await Holding.find(query).sort({ symbol: 1 });

    // Update current prices
    const updatedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        try {
          console.log(`Fetching price for ${holding.symbol}...`);
          const quote = await getStockQuote(holding.symbol);
          console.log(`Quote for ${holding.symbol}:`, quote);
          
          if (quote && quote.price > 0) {
            const marketValue = holding.shares * quote.price;
            const gainLoss = marketValue - holding.totalCost;
            const gainLossPercent = holding.totalCost > 0 ? (gainLoss / holding.totalCost) * 100 : 0;

            console.log(`Updating ${holding.symbol}: price=${quote.price}, marketValue=${marketValue}, gainLoss=${gainLoss}`);

            await Holding.findByIdAndUpdate(holding._id, {
              currentPrice: quote.price,
              marketValue,
              gainLoss,
              gainLossPercent,
              lastUpdated: new Date(),
            });

            return {
              ...holding.toObject(),
              currentPrice: quote.price,
              marketValue,
              gainLoss,
              gainLossPercent,
              lastUpdated: new Date(),
            };
          } else {
            console.log(`No valid quote for ${holding.symbol}:`, quote);
          }
        } catch (error) {
          console.error(`Error updating price for ${holding.symbol}:`, error);
        }
        
        return holding.toObject();
      })
    );

    return NextResponse.json({ holdings: updatedHoldings });
  } catch (error) {
    console.error('Get holdings error:', error);
    return NextResponse.json(
      { error: 'Failed to get holdings' },
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

    const { portfolioId, symbol, shares, price, transactionType, date, notes } = await request.json();

    if (!portfolioId || !symbol || !shares || !price || !transactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Verify portfolio belongs to user
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      userId: session.user.id,
      isActive: true,
    });
    
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Get stock quote for name
    const quote = await getStockQuote(symbol);
    const stockName = quote?.name || symbol;

    // Update or create holding first
    let holding = await Holding.findOne({
      portfolioId,
      symbol: symbol.toUpperCase(),
    });

    if (!holding) {
      // Create new holding
      holding = new Holding({
        portfolioId,
        symbol: symbol.toUpperCase(),
        name: stockName,
        shares: 0,
        averageCost: 0,
        totalCost: 0,
      });
    }

    if (transactionType === 'BUY') {
      const newTotalShares = holding.shares + shares;
      const newTotalCost = holding.totalCost + (shares * price);
      const newAverageCost = newTotalCost / newTotalShares;

      holding.shares = newTotalShares;
      holding.totalCost = newTotalCost;
      holding.averageCost = newAverageCost;
    } else if (transactionType === 'SELL') {
      const newTotalShares = holding.shares - shares;
      
      if (newTotalShares <= 0) {
        // Remove holding if all shares sold
        await Holding.findByIdAndDelete(holding._id);
        return NextResponse.json({
          success: true,
          message: 'Transaction recorded and holding removed',
        });
      }

      // Update average cost based on FIFO or just reduce shares
      holding.shares = newTotalShares;
      // Keep the same average cost for remaining shares
    }

    // Update current price and market value
    if (quote) {
      holding.currentPrice = quote.price;
      holding.marketValue = holding.shares * quote.price;
      holding.gainLoss = holding.marketValue - holding.totalCost;
      holding.gainLossPercent = holding.totalCost > 0 ? (holding.gainLoss / holding.totalCost) * 100 : 0;
    }

    await holding.save();

    // Create transaction record with holdingId
    const transaction = new InvestmentTransaction({
      portfolioId,
      holdingId: holding._id,
      symbol: symbol.toUpperCase(),
      transactionType,
      shares: Math.abs(shares),
      price,
      totalAmount: Math.abs(shares) * price,
      date: date ? new Date(date) : new Date(),
      notes,
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      holding,
      transaction,
      message: 'Transaction recorded successfully',
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to add transaction' },
      { status: 500 }
    );
  }
}
