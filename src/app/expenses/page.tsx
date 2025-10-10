/**
 * Expenses page with Plaid integration
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
import PlaidLink, { ConnectedAccountCard } from "@/components/PlaidLink";
import { Banknote, TrendingUp, CreditCard, PieChart, Plus } from "lucide-react";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [expenses, setExpenses] = useState([
    { id: 1, description: "Groceries", amount: 150.00, category: "Food", date: "2024-01-15" },
    { id: 2, description: "Gas", amount: 45.00, category: "Transportation", date: "2024-01-14" },
    { id: 3, description: "Coffee", amount: 12.50, category: "Food", date: "2024-01-13" },
  ]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "" });
  
  // Plaid integration state
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkTokenLoading, setLinkTokenLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Load connected accounts on component mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await fetch('/api/plaid/accounts');
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const createLinkToken = async () => {
    setLinkTokenLoading(true);
    try {
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLinkToken(data.link_token);
      } else {
        console.error('Failed to create link token');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
    } finally {
      setLinkTokenLoading(false);
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          institution_id: metadata.institution?.institution_id,
          institution_name: metadata.institution?.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
        setLinkToken(null); // Reset for next use
      } else {
        console.error('Failed to exchange token');
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/plaid/accounts?accountId=${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setConnectedAccounts(accounts => accounts.filter(acc => acc._id !== accountId));
      } else {
        console.error('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount) {
      const expense = {
        id: expenses.length + 1,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category || "Other",
        date: new Date().toISOString().split('T')[0]
      };
      setExpenses([...expenses, expense]);
      setNewExpense({ description: "", amount: "", category: "" });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              💰 Expenses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/investments")} className="whitespace-nowrap text-xs px-3 py-2">
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
            💰 Expense Tracking
          </h1>
          <p className="text-gray-600">
            Monitor and manage your spending with bank account integration
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Accounts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Budgets
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalExpenses.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Connected Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {connectedAccounts.length}
                  </div>
                  <p className="text-sm text-gray-500">Bank accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {expenses.length}
                  </div>
                  <p className="text-sm text-gray-500">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Add Expense */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Add Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                  <Input
                    placeholder="Category"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  />
                  <Button onClick={addExpense} className="w-full">
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Bank Accounts</h2>
                <p className="text-gray-600">Connect your bank accounts to automatically track expenses</p>
              </div>
              <Button onClick={createLinkToken} disabled={linkTokenLoading}>
                {linkTokenLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Account
                  </>
                )}
              </Button>
            </div>

            {/* Plaid Link Component */}
            {linkToken && (
              <div className="max-w-md mx-auto">
                <PlaidLink
                  linkToken={linkToken}
                  onSuccess={handlePlaidSuccess}
                  loading={linkTokenLoading}
                />
              </div>
            )}

            {/* Connected Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountsLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts connected</h3>
                    <p className="text-gray-500 text-center mb-4">
                      Connect your bank accounts to automatically track transactions and expenses.
                    </p>
                    <Button onClick={createLinkToken}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Your First Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                connectedAccounts.map((account) => (
                  <ConnectedAccountCard
                    key={account._id}
                    account={account}
                    onDisconnect={handleDisconnectAccount}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Transaction History</h2>
                <p className="text-gray-600">View all your expenses and transactions</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{expense.category}</Badge>
                              <span className="text-sm text-gray-500">{expense.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${expense.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Budget Management</h2>
                <p className="text-gray-600">Set and track your spending limits</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget tracking coming soon</h3>
                <p className="text-gray-500 text-center">
                  Set spending limits, track progress, and get alerts when you're approaching your budget.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}