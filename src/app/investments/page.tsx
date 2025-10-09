/**
 * Investment Portfolio Tracking page
 */
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Eye, 
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Star,
  History,
  LineChart
} from "lucide-react";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Portfolio creation state
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ name: "", description: "" });
  
  // Transaction state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    symbol: "",
    shares: "",
    price: "",
    transactionType: "BUY",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadPortfolios();
    loadWatchlist();
  }, []);

  const loadPortfolios = async () => {
    try {
      console.log('Loading portfolios...');
      const response = await fetch('/api/investments/portfolios');
      console.log('Portfolios response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Portfolios data:', data);
        const portfolioList = data.portfolios || [];
        console.log('Setting portfolios state:', portfolioList);
        setPortfolios(portfolioList);
        console.log('Portfolios state updated, length:', portfolioList.length);
        if (portfolioList.length > 0 && !selectedPortfolio) {
          console.log('Setting selected portfolio:', portfolioList[0]);
          setSelectedPortfolio(portfolioList[0]);
        }
      } else {
        console.error('Portfolios API error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHoldings = async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/investments/holdings?portfolioId=${portfolioId}`);
      if (response.ok) {
        const data = await response.json();
        setHoldings(data.holdings || []);
      }
    } catch (error) {
      console.error('Failed to load holdings:', error);
    }
  };

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/investments/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const loadTransactions = async () => {
    if (!selectedPortfolio) return;
    try {
      const response = await fetch(`/api/investments/transactions?portfolioId=${selectedPortfolio._id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadHistoricalData = async () => {
    if (!selectedPortfolio || holdings.length === 0) {
      console.log('Skipping historical data load:', { selectedPortfolio: !!selectedPortfolio, holdingsCount: holdings.length });
      return;
    }
    try {
      console.log('Loading historical data for symbols:', holdings.map(h => h.symbol));
      // Load historical data for portfolio performance
      const symbols = holdings.map(h => h.symbol).join(',');
      const response = await fetch(`/api/investments/historical?symbols=${symbols}`);
      console.log('Historical data response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Historical data received:', data);
        setHistoricalData(data.historicalData || []);
      } else {
        console.error('Failed to fetch historical data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const createPortfolio = async () => {
    if (!newPortfolio.name) return;

    try {
      const response = await fetch('/api/investments/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPortfolio),
      });

      if (response.ok) {
        await loadPortfolios();
        setNewPortfolio({ name: "", description: "" });
        setShowCreatePortfolio(false);
      }
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  const searchStocks = async (query: string) => {
    if (query.length < 2) return;
    
    setSearching(true);
    try {
      const response = await fetch(`/api/investments/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to search stocks:', error);
    } finally {
      setSearching(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    try {
      const response = await fetch('/api/investments/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name }),
      });

      if (response.ok) {
        await loadWatchlist();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const addTransaction = async () => {
    if (!selectedPortfolio || !newTransaction.symbol || !newTransaction.shares || !newTransaction.price) return;

    try {
      const response = await fetch('/api/investments/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio._id,
          ...newTransaction,
        }),
      });

      if (response.ok) {
        await loadHoldings(selectedPortfolio._id);
        setNewTransaction({
          symbol: "",
          shares: "",
          price: "",
          transactionType: "BUY",
          date: new Date().toISOString().split('T')[0],
          notes: ""
        });
        setShowAddTransaction(false);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  // Load holdings, transactions, and historical data when portfolio changes
  useEffect(() => {
    if (selectedPortfolio) {
      loadHoldings(selectedPortfolio._id);
      loadTransactions();
    }
  }, [selectedPortfolio]);

  // Load historical data when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      loadHistoricalData();
    }
  }, [holdings]);

  // Calculate portfolio totals
  const portfolioTotals = holdings.reduce((totals, holding) => {
    totals.totalValue += holding.marketValue || 0;
    totals.totalCost += holding.totalCost || 0;
    totals.totalGainLoss += holding.gainLoss || 0;
    return totals;
  }, { totalValue: 0, totalCost: 0, totalGainLoss: 0 });

  // Debug logging
  console.log('Current state:', {
    portfolios: portfolios.length,
    selectedPortfolio: selectedPortfolio?.name,
    holdings: holdings.length,
    loading,
    portfolioTotals,
    holdingsData: holdings,
    holdingsMarketValues: holdings.map(h => ({ symbol: h.symbol, marketValue: h.marketValue, totalCost: h.totalCost }))
  });

  const totalGainLossPercent = portfolioTotals.totalCost > 0 
    ? (portfolioTotals.totalGainLoss / portfolioTotals.totalCost) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🏆 Concierge.com</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="whitespace-nowrap text-xs px-3 py-2">
              🏠 Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")} className="whitespace-nowrap text-xs px-3 py-2">
              💰 Expenses
            </Button>
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              📈 Investments
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/health")} className="whitespace-nowrap text-xs px-3 py-2">
              🏥 Health
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/insurance")} className="whitespace-nowrap text-xs px-3 py-2">
              🛡️ Insurance
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/legal")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚖️ Legal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/tax")} className="whitespace-nowrap text-xs px-3 py-2">
              📊 Tax
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/travel")} className="whitespace-nowrap text-xs px-3 py-2">
              ✈️ Travel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="whitespace-nowrap text-xs px-3 py-2">
              💬 Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/ai-agents")} className="whitespace-nowrap text-xs px-3 py-2">
              🤖 AI Agents
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📈 Investment Portfolio
          </h1>
          <p className="text-gray-600">
            Track and manage your investment portfolios with real-time data
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="portfolios" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Portfolios
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="rebalance" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Rebalance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${portfolioTotals.totalValue.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Current market value</p>
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: holdings={holdings.length}, selected={selectedPortfolio?.name}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Gain/Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${portfolioTotals.totalGainLoss.toLocaleString()}
                    </div>
                    <p className={`text-sm ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {totalGainLossPercent.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {holdings.length}
                    </div>
                    <p className="text-sm text-gray-500">Active positions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              {selectedPortfolio && holdings.length > 0 && (
                <div className="space-y-4">
                  {/* Debug info */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Chart Debug:</strong> holdings={holdings.length}, historicalData={historicalData.length}, 
                    portfolioValue=${portfolioTotals.totalValue.toFixed(2)}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Portfolio Performance Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LineChart className="h-5 w-5 mr-2" />
                        Portfolio Performance
                      </CardTitle>
                      <CardDescription>30-day performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {historicalData.length > 0 ? (
                          <div className="p-4">
                            <div className="text-sm text-gray-600 mb-3">
                              Debug: {historicalData.length} historical data points loaded
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Portfolio Value:</span>
                                <span className="font-medium">${portfolioTotals.totalValue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Total Cost:</span>
                                <span className="font-medium">${portfolioTotals.totalCost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Gain/Loss:</span>
                                <span className={`font-medium ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${portfolioTotals.totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
                                </span>
                              </div>
                              <div className="mt-4 p-3 bg-blue-50 rounded">
                                <p className="text-sm text-blue-800">
                                  💡 Advanced charts will show historical performance trends once we have more data points.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">Loading performance data...</p>
                              <p className="text-xs text-gray-400 mt-2">Historical data: {historicalData.length} points</p>
                              <p className="text-xs text-gray-400">Holdings: {holdings.length}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Asset Allocation Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <RechartsPieChart className="h-5 w-5 mr-2" />
                        Asset Allocation
                      </CardTitle>
                      <CardDescription>Portfolio composition by value</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {holdings.length > 0 ? (
                          <div className="space-y-4 p-4">
                            <div className="text-sm text-gray-600 mb-3">
                              Debug: {holdings.length} holdings, Total Value: ${portfolioTotals.totalValue.toFixed(2)}
                            </div>
                            {holdings.map((holding, index) => {
                              const percentage = portfolioTotals.totalValue > 0 
                                ? (holding.marketValue / portfolioTotals.totalValue) * 100 
                                : 0;
                              return (
                                <div key={holding._id} className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: `hsl(${index * 137.5}, 70%, 50%)` }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{holding.symbol}</span>
                                      <span className="text-sm text-gray-600">
                                        ${holding.marketValue?.toFixed(2) || '0.00'} ({percentage.toFixed(1)}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div 
                                        className="h-2 rounded-full"
                                        style={{ 
                                          width: `${percentage}%`,
                                          backgroundColor: `hsl(${index * 137.5}, 70%, 50%)`
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p>No holdings to display</p>
                              <p className="text-xs mt-2">Holdings count: {holdings.length}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </div>
              )}

              {/* Portfolio Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Selection</CardTitle>
                  <CardDescription>Choose a portfolio to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Debug info */}
                  <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
                    <strong>Debug:</strong> portfolios.length = {portfolios.length}, 
                    selectedPortfolio = {selectedPortfolio?.name || 'none'}, 
                    loading = {loading.toString()}
                  </div>
                  
                  {/* Force show portfolios for debugging */}
                  <div className="mb-4 p-2 bg-yellow-100 rounded text-sm">
                    <strong>Conditional Check:</strong> portfolios.length === 0 is {portfolios.length === 0 ? 'TRUE' : 'FALSE'}
                  </div>
                  
                  {portfolios.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No portfolios yet</h3>
                      <p className="text-gray-500 mb-4">Create your first portfolio to start tracking investments.</p>
                      <Button onClick={() => setShowCreatePortfolio(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Portfolio
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {portfolios.map((portfolio) => (
                        <Card 
                          key={portfolio._id}
                          className={`cursor-pointer transition-colors ${
                            selectedPortfolio?._id === portfolio._id 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPortfolio(portfolio)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                            <CardDescription>{portfolio.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600">
                              {portfolio.holdings?.length || 0} holdings
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Card 
                        className="cursor-pointer hover:bg-gray-50 border-dashed border-2 border-gray-300"
                        onClick={() => setShowCreatePortfolio(true)}
                      >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <Plus className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-600">Create New Portfolio</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolios Tab */}
            <TabsContent value="portfolios" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Portfolio Holdings</h2>
                  <p className="text-gray-600">View and manage your investment holdings</p>
                </div>
                {selectedPortfolio && (
                  <Button onClick={() => setShowAddTransaction(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                )}
              </div>

              {selectedPortfolio ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedPortfolio.name}</CardTitle>
                    <CardDescription>{selectedPortfolio.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {holdings.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No holdings yet</h3>
                        <p className="text-gray-500 mb-4">Add your first transaction to start tracking this portfolio.</p>
                        <Button onClick={() => setShowAddTransaction(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Transaction
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {holdings.map((holding) => (
                          <div key={holding._id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div>
                              <h3 className="font-semibold">{holding.name}</h3>
                              <p className="text-sm text-gray-600">
                                {holding.symbol} • {holding.shares} shares @ ${holding.averageCost?.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                ${holding.marketValue?.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-2">
                                {holding.gainLoss >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${holding.gainLoss?.toFixed(2)} ({holding.gainLossPercent?.toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a portfolio</h3>
                    <p className="text-gray-500 text-center">
                      Choose a portfolio from the Overview tab to view its holdings.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Transaction History</h2>
                  <p className="text-gray-600">Track all your buy and sell transactions</p>
                </div>
                {selectedPortfolio && (
                  <Button onClick={() => setShowAddTransaction(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                )}
              </div>

              {!selectedPortfolio ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a portfolio</h3>
                    <p className="text-gray-500 text-center">
                      Choose a portfolio from the Overview tab to view its transaction history.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      {selectedPortfolio.name} - Transaction History
                    </CardTitle>
                    <CardDescription>
                      {transactions.length} transactions recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-500 mb-4">Add your first transaction to start tracking this portfolio.</p>
                        <Button onClick={() => setShowAddTransaction(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Transaction
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((transaction) => (
                          <div key={transaction._id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                transaction.transactionType === 'BUY' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.transactionType}
                              </div>
                              <div>
                                <h3 className="font-semibold">{transaction.symbol}</h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {transaction.shares} shares @ ${transaction.price.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Total: ${(transaction.shares * transaction.price).toLocaleString()}
                              </p>
                              {transaction.notes && (
                                <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Stock Watchlist</h2>
                  <p className="text-gray-600">Monitor stocks you're interested in</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchStocks(e.target.value);
                      }}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <div key={result.symbol} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-gray-600">{result.symbol}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => addToWatchlist(result.symbol, result.name)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Watch
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Watchlist */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {watchlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No stocks in watchlist</h3>
                      <p className="text-gray-500">Search for stocks above to add them to your watchlist.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {watchlist.map((item) => (
                        <div key={item._id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.symbol}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ${item.currentPrice?.toFixed(2) || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2">
                              {item.change >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`text-sm ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${item.change?.toFixed(2)} ({item.changePercent?.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rebalance Tab */}
            <TabsContent value="rebalance" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Portfolio Rebalancing</h2>
                  <p className="text-gray-600">Optimize your portfolio allocation</p>
                </div>
              </div>

              {!selectedPortfolio ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a portfolio</h3>
                    <p className="text-gray-500 text-center">
                      Choose a portfolio from the Overview tab to view rebalancing suggestions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current Allocation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        Current Allocation
                      </CardTitle>
                      <CardDescription>Your current portfolio distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {holdings.length > 0 ? (
                        <div className="space-y-3">
                          {holdings.map((holding) => {
                            const percentage = portfolioTotals.totalValue > 0 
                              ? (holding.marketValue / portfolioTotals.totalValue) * 100 
                              : 0;
                            return (
                              <div key={holding._id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <h4 className="font-semibold">{holding.symbol}</h4>
                                  <p className="text-sm text-gray-600">{holding.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">${holding.marketValue?.toFixed(2) || 0}</p>
                                  <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No holdings to analyze
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Rebalancing Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Rebalancing Suggestions
                      </CardTitle>
                      <CardDescription>Recommended actions to optimize allocation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {holdings.length > 0 ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">💡 Smart Suggestions</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Consider diversifying across sectors</li>
                              <li>• Rebalance quarterly to maintain target allocation</li>
                              <li>• Consider adding bonds for stability</li>
                              <li>• Monitor concentration risk in single stocks</li>
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">✅ Portfolio Health</h4>
                            <div className="text-sm text-green-800 space-y-1">
                              <p>• Number of positions: {holdings.length}</p>
                              <p>• Total diversification score: {holdings.length >= 3 ? 'Good' : 'Needs improvement'}</p>
                              <p>• Risk level: {holdings.length >= 5 ? 'Balanced' : 'Concentrated'}</p>
                            </div>
                          </div>

                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Attention Needed</h4>
                            {holdings.some(h => (h.marketValue / portfolioTotals.totalValue) > 0.4) ? (
                              <p className="text-sm text-yellow-800">
                                Consider reducing concentration in single positions (over 40%)
                              </p>
                            ) : (
                              <p className="text-sm text-yellow-800">
                                Portfolio allocation looks balanced
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Add holdings to get rebalancing suggestions
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Create Portfolio Modal */}
        {showCreatePortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Portfolio name"
                  value={newPortfolio.name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={createPortfolio} className="flex-1">
                    Create
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreatePortfolio(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddTransaction && selectedPortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>Add a buy or sell transaction to {selectedPortfolio.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Symbol (e.g., AAPL)"
                  value={newTransaction.symbol}
                  onChange={(e) => setNewTransaction({ ...newTransaction, symbol: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Shares"
                    type="number"
                    value={newTransaction.shares}
                    onChange={(e) => setNewTransaction({ ...newTransaction, shares: e.target.value })}
                  />
                  <Input
                    placeholder="Price per share"
                    type="number"
                    step="0.01"
                    value={newTransaction.price}
                    onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newTransaction.transactionType}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transactionType: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={addTransaction} className="flex-1">
                    Add Transaction
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
