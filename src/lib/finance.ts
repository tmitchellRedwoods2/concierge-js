const alpha = require('alphavantage')({ key: process.env.ALPHA_VANTAGE_API_KEY || 'demo' });

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  dividendYield?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: Date;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

// Cache for quotes to avoid rate limiting
const quoteCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

// Fallback prices for common stocks when Yahoo Finance is unavailable
const FALLBACK_PRICES: Record<string, { name: string; price: number }> = {
  AAPL: { name: 'Apple Inc.', price: 175.50 },
  MSFT: { name: 'Microsoft Corporation', price: 330.25 },
  GOOGL: { name: 'Alphabet Inc.', price: 138.75 },
  AMZN: { name: 'Amazon.com Inc.', price: 145.80 },
  TSLA: { name: 'Tesla Inc.', price: 245.30 },
  META: { name: 'Meta Platforms Inc.', price: 285.90 },
  NVDA: { name: 'NVIDIA Corporation', price: 425.60 },
  NFLX: { name: 'Netflix Inc.', price: 485.20 },
  AMD: { name: 'Advanced Micro Devices', price: 115.40 },
  INTC: { name: 'Intel Corporation', price: 42.85 },
  SPY: { name: 'SPDR S&P 500 ETF Trust', price: 520.75 },
  QQQ: { name: 'Invesco QQQ Trust', price: 445.30 },
};

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // Check cache first
    const cached = quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached quote for ${symbol}`);
      return cached.data;
    }

    console.log(`Fetching quote for ${symbol} from Alpha Vantage...`);
    
    // Use Alpha Vantage GLOBAL_QUOTE endpoint
    const data = await alpha.data.quote(symbol);
    
    console.log('Alpha Vantage response:', data);
    
    if (!data || !data['Global Quote'] || !data['Global Quote']['05. price']) {
      console.log(`No data returned from Alpha Vantage for ${symbol}`);
      throw new Error('No data returned from Alpha Vantage');
    }

    const result = data['Global Quote'];
    const price = parseFloat(result['05. price']);
    const change = parseFloat(result['09. change']);
    const changePercent = parseFloat(result['10. change percent'].replace('%', ''));

    const quote: StockQuote = {
      symbol: result['01. symbol'] || symbol.toUpperCase(),
      name: symbol.toUpperCase(), // Alpha Vantage doesn't provide company name in quote
      price,
      change,
      changePercent,
      volume: parseInt(result['06. volume']) || 0,
      high52Week: parseFloat(result['03. high']) || undefined,
      low52Week: parseFloat(result['04. low']) || undefined,
      lastUpdated: new Date(),
    };

    console.log(`Successfully fetched quote for ${symbol}:`, quote);

    // Cache the result
    quoteCache.set(symbol, { data: quote, timestamp: Date.now() });

    return quote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    
    // Return fallback price if available
    const fallback = FALLBACK_PRICES[symbol.toUpperCase()];
    if (fallback) {
      console.log(`Using fallback price for ${symbol}: $${fallback.price}`);
      const fallbackQuote: StockQuote = {
        symbol: symbol.toUpperCase(),
        name: fallback.name,
        price: fallback.price,
        change: 0,
        changePercent: 0,
        volume: 0,
        lastUpdated: new Date(),
      };
      
      // Cache the fallback result
      quoteCache.set(symbol, { data: fallbackQuote, timestamp: Date.now() });
      return fallbackQuote;
    }
    
    return null;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  try {
    const quotes = await Promise.all(
      symbols.map(symbol => getStockQuote(symbol))
    );
    
    return quotes.filter((quote): quote is StockQuote => quote !== null);
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    return [];
  }
}

export async function getHistoricalData(
  symbol: string, 
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' = '1mo'
): Promise<HistoricalData[]> {
  try {
    // Alpha Vantage uses outputsize: 'compact' (100 days) or 'full' (20 years)
    const outputsize = ['1y', '2y', '5y', '10y', 'max'].includes(period) ? 'full' : 'compact';
    
    const data = await alpha.data.daily(symbol, outputsize);
    
    if (!data || !data['Time Series (Daily)']) {
      return [];
    }

    const timeSeries = data['Time Series (Daily)'];
    const results: HistoricalData[] = [];
    
    for (const [date, values] of Object.entries(timeSeries)) {
      const dailyData = values as any;
      results.push({
        date,
        open: parseFloat(dailyData['1. open']),
        high: parseFloat(dailyData['2. high']),
        low: parseFloat(dailyData['3. low']),
        close: parseFloat(dailyData['4. close']),
        volume: parseInt(dailyData['5. volume']),
      });
    }
    
    // Sort by date descending (most recent first)
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return results;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

export async function searchStocks(query: string): Promise<Array<{ symbol: string; name: string }>> {
  try {
    console.log('Searching for:', query);
    
    // Alpha Vantage search endpoint
    const data = await alpha.data.search(query);
    
    console.log('Alpha Vantage search result:', data);
    
    if (!data || !data.bestMatches || data.bestMatches.length === 0) {
      console.log('No matches in search result');
      throw new Error('No results from Alpha Vantage');
    }
    
    const results = data.bestMatches
      .slice(0, 10)
      .map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
      }));
    
    console.log('Filtered results:', results);
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    // Fallback to common stocks if search fails
    const fallbackStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    ];
    
    // Filter fallback stocks based on query
    return fallbackStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

function getPeriodStartDate(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '5d':
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case '1mo':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3mo':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6mo':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case '2y':
      return new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    case '5y':
      return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
    case '10y':
      return new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1);
    case 'max':
      return new Date(2000, 0, 1);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getInterval(period: string): '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo' {
  switch (period) {
    case '1d':
      return '5m';
    case '5d':
      return '1h';
    case '1mo':
      return '1d';
    case '3mo':
      return '1d';
    case '6mo':
      return '1d';
    case '1y':
      return '1wk';
    case '2y':
      return '1wk';
    case '5y':
      return '1mo';
    case '10y':
      return '1mo';
    case 'ytd':
      return '1wk';
    case 'max':
      return '3mo';
    default:
      return '1d';
  }
}

export function calculatePortfolioPerformance(
  holdings: Array<{
    shares: number;
    averageCost: number;
    currentPrice: number;
  }>
): PortfolioPerformance {
  let totalCost = 0;
  let totalValue = 0;
  let dayChange = 0;

  holdings.forEach(holding => {
    const cost = holding.shares * holding.averageCost;
    const value = holding.shares * holding.currentPrice;
    
    totalCost += cost;
    totalValue += value;
    // Note: day change would need previous day's prices
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dayChange,
    dayChangePercent: 0, // Would need previous day data
  };
}
