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
  Star
} from "lucide-react";

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
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
      const response = await fetch('/api/investments/portfolios');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
        if (data.portfolios.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(data.portfolios[0]);
        }
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

  // Load holdings when portfolio changes
  useEffect(() => {
    if (selectedPortfolio) {
      loadHoldings(selectedPortfolio._id);
    }
  }, [selectedPortfolio]);

  // Calculate portfolio totals
  const portfolioTotals = holdings.reduce((totals, holding) => {
    totals.totalValue += holding.marketValue || 0;
    totals.totalCost += holding.totalCost || 0;
    totals.totalGainLoss += holding.gainLoss || 0;
    return totals;
  }, { totalValue: 0, totalCost: 0, totalGainLoss: 0 });

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
            <TabsList className="grid w-full grid-cols-4">
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

              {/* Portfolio Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Selection</CardTitle>
                  <CardDescription>Choose a portfolio to view details</CardDescription>
                </CardHeader>
                <CardContent>
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
                <Button onClick={() => setShowAddTransaction(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>

              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction tracking coming soon</h3>
                  <p className="text-gray-500 text-center">
                    View detailed transaction history, export data, and analyze trading patterns.
                  </p>
                </CardContent>
              </Card>
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
