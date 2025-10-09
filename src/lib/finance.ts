const yahooFinance = require('yahoo-finance2');

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
      return cached.data;
    }

    const result = await yahooFinance.quote(symbol);
    
    if (!result) {
      return null;
    }

    const quote: StockQuote = {
      symbol: result.symbol || symbol,
      name: result.longName || result.shortName || symbol,
      price: result.regularMarketPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      volume: result.regularMarketVolume || 0,
      marketCap: result.marketCap,
      pe: result.trailingPE,
      dividend: result.dividendRate,
      dividendYield: result.dividendYield,
      high52Week: result.fiftyTwoWeekHigh,
      low52Week: result.fiftyTwoWeekLow,
      lastUpdated: new Date(),
    };

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
    const result = await yahooFinance.historical(symbol, {
      period1: getPeriodStartDate(period),
      period2: new Date(),
      interval: getInterval(period),
    });

    return result.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

export async function searchStocks(query: string): Promise<Array<{ symbol: string; name: string }>> {
  try {
    console.log('Searching for:', query);
    
    // Use Yahoo Finance search
    const searchResult = await yahooFinance.search(query);
    console.log('Search result:', searchResult);
    
    if (!searchResult || !searchResult.quotes) {
      console.log('No quotes in search result');
      return [];
    }
    
    const results = searchResult.quotes
      .filter(quote => quote && quote.symbol && (quote.longname || quote.shortname))
      .slice(0, 10)
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
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
