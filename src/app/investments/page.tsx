/**
 * Investments page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [investments, setInvestments] = useState([
    { id: 1, name: "Apple Inc.", symbol: "AAPL", shares: 10, price: 150.00, value: 1500.00 },
    { id: 2, name: "Tesla Inc.", symbol: "TSLA", shares: 5, price: 200.00, value: 1000.00 },
    { id: 3, name: "S&P 500 ETF", symbol: "SPY", shares: 20, price: 400.00, value: 8000.00 },
  ]);
  const [newInvestment, setNewInvestment] = useState({ name: "", symbol: "", shares: "", price: "" });

  const addInvestment = () => {
    if (newInvestment.name && newInvestment.symbol && newInvestment.shares && newInvestment.price) {
      const investment = {
        id: investments.length + 1,
        name: newInvestment.name,
        symbol: newInvestment.symbol.toUpperCase(),
        shares: parseInt(newInvestment.shares),
        price: parseFloat(newInvestment.price),
        value: parseInt(newInvestment.shares) * parseFloat(newInvestment.price)
      };
      setInvestments([...investments, investment]);
      setNewInvestment({ name: "", symbol: "", shares: "", price: "" });
    }
  };

  const totalValue = investments.reduce((sum, investment) => sum + investment.value, 0);

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
                onClick={() => router.push("/")}
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
            Track and manage your investment portfolio
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {investments.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +$125.50
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Investment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Investment</CardTitle>
            <CardDescription>Track a new investment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Company Name"
                value={newInvestment.name}
                onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
              />
              <Input
                placeholder="Symbol"
                value={newInvestment.symbol}
                onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value })}
              />
              <Input
                placeholder="Shares"
                type="number"
                value={newInvestment.shares}
                onChange={(e) => setNewInvestment({ ...newInvestment, shares: e.target.value })}
              />
              <Input
                placeholder="Price per Share"
                type="number"
                step="0.01"
                value={newInvestment.price}
                onChange={(e) => setNewInvestment({ ...newInvestment, price: e.target.value })}
              />
              <Button onClick={addInvestment} className="w-full">
                Add Investment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Investments List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Portfolio</CardTitle>
            <CardDescription>Current holdings and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{investment.name}</h3>
                    <p className="text-sm text-gray-600">{investment.symbol} • {investment.shares} shares @ ${investment.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${investment.value.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+2.5%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
