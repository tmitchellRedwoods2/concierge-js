import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHistoricalData } from '@/lib/finance';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const period = searchParams.get('period') || '1mo';

    if (!symbols) {
      return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 });
    }

    const symbolArray = symbols.split(',').map(s => s.trim());
    
    // Get historical data for each symbol
    const historicalDataPromises = symbolArray.map(async (symbol) => {
      try {
        const data = await getHistoricalData(symbol, period as any);
        return {
          symbol,
          data: data.slice(0, 30) // Limit to 30 data points for performance
        };
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        return {
          symbol,
          data: []
        };
      }
    });

    const historicalData = await Promise.all(historicalDataPromises);

    // Combine data for portfolio performance
    const combinedData = [];
    if (historicalData.length > 0 && historicalData[0].data.length > 0) {
      const dates = historicalData[0].data.map(d => d.date);
      
      for (let i = 0; i < dates.length; i++) {
        const dataPoint: any = {
          date: dates[i],
          portfolioValue: 0,
          portfolioCost: 0
        };

        // Sum up values for all symbols on this date
        historicalData.forEach(({ symbol, data }) => {
          if (data[i]) {
            dataPoint[`${symbol}_close`] = data[i].close;
            dataPoint[`${symbol}_volume`] = data[i].volume;
          }
        });

        combinedData.push(dataPoint);
      }
    }

    return NextResponse.json({ 
      status: 'ok',
      historicalData: combinedData,
      symbols: symbolArray,
      period
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
