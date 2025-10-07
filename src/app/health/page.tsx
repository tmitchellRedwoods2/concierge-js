/**
 * Health page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [healthMetrics, setHealthMetrics] = useState([
    { id: 1, type: "Weight", value: "175 lbs", date: "2024-01-15", trend: "down" },
    { id: 2, type: "Blood Pressure", value: "120/80", date: "2024-01-14", trend: "stable" },
    { id: 3, type: "Steps", value: "8,500", date: "2024-01-15", trend: "up" },
  ]);
  const [newMetric, setNewMetric] = useState({ type: "", value: "", date: "" });

  const addMetric = () => {
    if (newMetric.type && newMetric.value && newMetric.date) {
      const metric = {
        id: healthMetrics.length + 1,
        type: newMetric.type,
        value: newMetric.value,
        date: newMetric.date,
        trend: "stable"
      };
      setHealthMetrics([...healthMetrics, metric]);
      setNewMetric({ type: "", value: "", date: "" });
    }
  };

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
            <Button variant="ghost" size="sm" onClick={() => router.push("/investments")} className="whitespace-nowrap text-xs px-3 py-2">
              📈 Investments
            </Button>
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
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
            🏥 Health Management
          </h1>
          <p className="text-gray-600">
            Track your health metrics and wellness goals
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                175 lbs
              </div>
              <p className="text-sm text-green-600">↓ 2 lbs this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                8,500
              </div>
              <p className="text-sm text-blue-600">Goal: 10,000</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blood Pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                120/80
              </div>
              <p className="text-sm text-green-600">Normal range</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Health Metric Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Health Metric</CardTitle>
            <CardDescription>Track a new health measurement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Metric Type (e.g., Weight, Blood Pressure)"
                value={newMetric.type}
                onChange={(e) => setNewMetric({ ...newMetric, type: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={newMetric.value}
                onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
              />
              <Input
                type="date"
                value={newMetric.date}
                onChange={(e) => setNewMetric({ ...newMetric, date: e.target.value })}
              />
              <Button onClick={addMetric} className="w-full">
                Add Metric
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics List */}
        <Card>
          <CardHeader>
            <CardTitle>Health History</CardTitle>
            <CardDescription>Your health metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthMetrics.map((metric) => (
                <div key={metric.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{metric.type}</h3>
                    <p className="text-sm text-gray-600">{metric.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{metric.value}</p>
                    <p className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} {metric.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Goals */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Health Goals</CardTitle>
            <CardDescription>Your wellness objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Weight Goal</h3>
                <p className="text-sm text-gray-600">Target: 170 lbs</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">5 lbs to go</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Exercise Goal</h3>
                <p className="text-sm text-gray-600">Target: 10,000 steps/day</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">1,500 steps to go</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
