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
import { Banknote, TrendingUp, CreditCard, PieChart, Plus, Edit, Trash2 } from "lucide-react";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "" });
  const [expensesLoading, setExpensesLoading] = useState(true);
  
  // Budget management state
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [newBudget, setNewBudget] = useState({
    name: "",
    category: "",
    amount: "",
    period: "monthly",
    startDate: "",
    endDate: ""
  });
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Transaction editing state
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState({
    description: "",
    amount: "",
    category: "",
    date: ""
  });
  
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
      } else if (response.status === 503) {
        const data = await response.json();
        alert(`Bank connection not configured: ${data.message}`);
      } else {
        console.error('Failed to create link token');
        alert('Failed to connect to bank services. Please try again later.');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
      alert('Failed to connect to bank services. Please try again later.');
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

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill in description and amount');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category || "Other",
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new expense to the local state
        const newExpenseItem = {
          id: data.expense._id,
          description: data.expense.description,
          amount: data.expense.amount,
          category: data.expense.category,
          date: data.expense.date
        };
        setExpenses([newExpenseItem, ...expenses]);
        setNewExpense({ description: "", amount: "", category: "" });
      } else {
        const errorData = await response.json();
        alert(`Failed to add expense: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExpenses(expenses.filter(expense => (expense._id || expense.id) !== expenseId));
      } else {
        alert('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const startEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setEditExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    });
    setShowExpenseForm(true);
  };

  const updateExpense = async () => {
    if (!editingExpense || !editExpense.description || !editExpense.amount) {
      alert('Please fill in description and amount');
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${editingExpense._id || editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editExpense),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the expense in the local state
        setExpenses(expenses.map(expense => 
          (expense._id || expense.id) === (editingExpense._id || editingExpense.id) 
            ? { ...expense, ...data.expense }
            : expense
        ));
        setShowExpenseForm(false);
        setEditingExpense(null);
        setEditExpense({ description: "", amount: "", category: "", date: "" });
      } else {
        const errorData = await response.json();
        alert(`Failed to update expense: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  };

  const cancelEdit = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setEditExpense({ description: "", amount: "", category: "", date: "" });
  };

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadBudgets = async () => {
    setBudgetsLoading(true);
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setBudgetsLoading(false);
    }
  };

  const createBudget = async () => {
    if (!newBudget.name || !newBudget.category || !newBudget.amount || !newBudget.startDate || !newBudget.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBudget),
      });

      if (response.ok) {
        const data = await response.json();
        setBudgets([data.budget, ...budgets]);
        setNewBudget({
          name: "",
          category: "",
          amount: "",
          period: "monthly",
          startDate: "",
          endDate: ""
        });
        setShowBudgetForm(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to create budget: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBudgets(budgets.filter(budget => budget._id !== budgetId));
      } else {
        alert('Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget. Please try again.');
    }
  };

  // Load expenses, budgets, and connected accounts on component mount
  useEffect(() => {
    loadExpenses();
    loadBudgets();
    loadConnectedAccounts();
  }, []);

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
            <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")} className="whitespace-nowrap text-xs px-3 py-2">
              🤖 Workflows
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
                  {expensesLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-red-600">
                        ${totalExpenses.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-500">This month</p>
                    </>
                  )}
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
                {expensesLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {expenses.length}
                    </div>
                    <p className="text-sm text-gray-500">This month</p>
                  </>
                )}
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

            {/* Edit Expense Modal */}
            {showExpenseForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>Edit Transaction</CardTitle>
                    <CardDescription>
                      Update the transaction details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Description"
                        value={editExpense.description}
                        onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                      />
                      <Input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        value={editExpense.amount}
                        onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                      />
                      <Input
                        placeholder="Category"
                        value={editExpense.category}
                        onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={editExpense.date}
                        onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={updateExpense} className="flex-1">
                        Update Transaction
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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

            {/* Plaid Configuration Notice */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Bank Integration Setup</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      Bank account connection requires Plaid API credentials. Currently using manual expense tracking.
                      Contact your administrator to enable automatic bank integration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                {expensesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center p-4 border rounded-lg animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions recorded yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Add your first expense above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense._id || expense.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{expense.category}</Badge>
                              <span className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-lg">${expense.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteExpense(expense._id || expense.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
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
              <Button onClick={() => setShowBudgetForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>

            {/* Budget Creation Form */}
            {showBudgetForm && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>Create New Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Budget Name (e.g., Groceries)"
                      value={newBudget.name}
                      onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                    />
                    <Input
                      placeholder="Category (e.g., Food)"
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                    />
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newBudget.period}
                      onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={newBudget.startDate}
                      onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={newBudget.endDate}
                      onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={createBudget}>Create Budget</Button>
                    <Button variant="outline" onClick={() => setShowBudgetForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budgets List */}
            {budgetsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PieChart className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets created yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Create your first budget to start tracking your spending limits.
                  </p>
                  <Button onClick={() => setShowBudgetForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Budget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const spentAmount = expenses
                    .filter(expense => expense.category === budget.category)
                    .reduce((sum, expense) => sum + expense.amount, 0);
                  const percentage = (spentAmount / budget.amount) * 100;
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage > 80;

                  return (
                    <Card key={budget._id} className={`${isOverBudget ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{budget.name}</h3>
                            <p className="text-gray-600 capitalize">{budget.category} • {budget.period}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBudget(budget._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Spent: ${spentAmount.toFixed(2)}</span>
                            <span>Budget: ${budget.amount.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={isOverBudget ? 'text-red-600 font-semibold' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}>
                              {percentage.toFixed(1)}% used
                            </span>
                            {isOverBudget && (
                              <span className="text-red-600 font-semibold">
                                Over budget by ${(spentAmount - budget.amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}