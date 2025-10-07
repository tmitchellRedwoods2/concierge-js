/**
 * Expenses page
 */
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState([
    { id: 1, description: "Groceries", amount: 150.00, category: "Food", date: "2024-01-15" },
    { id: 2, description: "Gas", amount: 45.00, category: "Transportation", date: "2024-01-14" },
    { id: 3, description: "Coffee", amount: 12.50, category: "Food", date: "2024-01-13" },
  ]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "" });

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
            💰 Expense Tracking
          </h1>
          <p className="text-gray-600">
            Monitor and manage your spending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add New Expense Card */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input
                  id="description"
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="e.g., Groceries, Gas, Coffee"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Amount ($)</label>
                <Input
                  id="amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Input
                  id="category"
                  type="text"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  placeholder="e.g., Food, Transportation, Entertainment"
                />
              </div>
              <Button onClick={addExpense} className="w-full">
                Add Expense
              </Button>
            </CardContent>
          </Card>

          {/* Expense Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>Overview of your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Expenses:</span>
                <span>${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Number of transactions:</span>
                  <span>{expenses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average per transaction:</span>
                  <span>${(totalExpenses / expenses.length).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{expense.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}