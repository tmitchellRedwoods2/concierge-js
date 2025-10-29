/**
 * Enhanced Dashboard page with comprehensive overview widgets
 */
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Heart, 
  Shield, 
  Scale, 
  Calculator, 
  Plane, 
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Calendar,
  Pill,
  FileText,
  Users
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import AIInsights from '@/components/dashboard/ai-insights';
import ThemeToggle from '@/components/dashboard/theme-toggle';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    portfolio: { totalValue: 0, totalGainLoss: 0, gainLossPercent: 0 },
    expenses: { monthlyTotal: 0, budgetRemaining: 0, categories: [] },
    health: { upcomingAppointments: 0, prescriptionAlerts: 0 },
    insurance: { activeClaims: 0, upcomingRenewals: 0 },
    loading: true
  });

  // Sample chart data
  const portfolioData = [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 47000 },
    { month: 'Mar', value: 46000 },
    { month: 'Apr', value: 49000 },
    { month: 'May', value: 52000 },
    { month: 'Jun', value: 51000 }
  ];

  const expenseData = [
    { category: 'Housing', amount: 2000, color: '#8884d8' },
    { category: 'Food', amount: 800, color: '#82ca9d' },
    { category: 'Transport', amount: 600, color: '#ffc658' },
    { category: 'Entertainment', amount: 400, color: '#ff7300' },
    { category: 'Other', amount: 300, color: '#00ff00' }
  ];

  const monthlyExpenses = [
    { month: 'Jan', expenses: 3200 },
    { month: 'Feb', expenses: 3800 },
    { month: 'Mar', expenses: 3500 },
    { month: 'Apr', expenses: 4100 },
    { month: 'May', expenses: 3900 },
    { month: 'Jun', expenses: 4100 }
  ];

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) router.push("/login"); // Not authenticated
    
    // Load dashboard data
    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      // Load portfolio data
      const portfolioResponse = await fetch('/api/investments/portfolios-simple');
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        const totalValue = portfolioData.portfolios?.reduce((sum: number, p: any) => sum + (p.totalValue || 0), 0) || 0;
        const totalCost = portfolioData.portfolios?.reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0) || 0;
        const totalGainLoss = totalValue - totalCost;
        const gainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
        
        setDashboardData(prev => ({
          ...prev,
          portfolio: { totalValue, totalGainLoss, gainLossPercent }
        }));
      }

      // Load expense data
      const expensesResponse = await fetch('/api/expenses');
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        const currentMonth = new Date().getMonth();
        const monthlyExpenses = expensesData.expenses?.filter((expense: any) => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth;
        }) || [];
        
        const monthlyTotal = monthlyExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
        
        setDashboardData(prev => ({
          ...prev,
          expenses: { ...prev.expenses, monthlyTotal }
        }));
      }

      setDashboardData(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

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
                Welcome, {session.user?.name}
              </span>
              <ThemeToggle />
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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              🏠 Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")} className="whitespace-nowrap text-xs px-3 py-2">
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚡ Automation
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🏆 Welcome back, {session.user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Your {session.user?.plan} plan dashboard - Comprehensive overview
          </p>
        </div>

        {/* Financial Overview Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Financial Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Portfolio Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Portfolio Performance
                </CardTitle>
                <CardDescription>
                  Total portfolio value and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      ${dashboardData.portfolio.totalValue.toLocaleString()}
                    </span>
                    <Badge variant={dashboardData.portfolio.totalGainLoss >= 0 ? "default" : "destructive"}>
                      {dashboardData.portfolio.totalGainLoss >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {dashboardData.portfolio.gainLossPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {dashboardData.portfolio.totalGainLoss >= 0 ? '+' : ''}${dashboardData.portfolio.totalGainLoss.toLocaleString()} total gain/loss
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={portfolioData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Monthly Expenses
                </CardTitle>
                <CardDescription>
                  Current month spending breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      ${dashboardData.expenses.monthlyTotal.toLocaleString()}
                    </span>
                    <Badge variant="outline">This Month</Badge>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={50}
                          dataKey="amount"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {expenseData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span>{item.category}: ${item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Health & Wellness Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🏥 Health & Wellness</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">2 upcoming</span>
                  </div>
                  <p className="text-sm text-gray-600">Next: Dr. Johnson - Tomorrow 2:00 PM</p>
                  <Button size="sm" variant="outline" onClick={() => router.push('/health')}>
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pill className="w-5 h-5 text-red-600" />
                  Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold">1 refill needed</span>
                  </div>
                  <p className="text-sm text-gray-600">Lisinopril - Due in 3 days</p>
                  <Button size="sm" variant="outline" onClick={() => router.push('/health')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Health Providers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">8 providers</span>
                  </div>
                  <p className="text-sm text-gray-600">Find specialists in your area</p>
                  <Button size="sm" variant="outline" onClick={() => router.push('/health')}>
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Insurance & Legal Status */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🛡️ Insurance & Legal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Insurance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Insurance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Active Policies</span>
                    <Badge variant="default">3 Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Open Claims</span>
                    <Badge variant="outline">1 Claim</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Renewals Due</span>
                    <Badge variant="secondary">Auto - Dec 15</Badge>
                  </div>
                  <Button className="w-full" onClick={() => router.push('/insurance')}>
                    Manage Insurance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Legal Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  Legal Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Active Cases</span>
                    <Badge variant="default">2 Cases</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Documents</span>
                    <Badge variant="outline">15 Files</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Next Deadline</span>
                    <Badge variant="secondary">Nov 30</Badge>
                  </div>
                  <Button className="w-full" onClick={() => router.push('/legal')}>
                    Manage Legal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI-Powered Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights />
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest transactions & updates across all modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Added expense: $45.00 - Groceries</span>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Appointment scheduled with Dr. Smith</span>
                    </div>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Insurance claim submitted</span>
                    </div>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Portfolio value updated: +$1,250</span>
                    </div>
                    <span className="text-xs text-gray-500">5 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-semibold">{session.user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{session.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold capitalize">{session.user?.plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-semibold text-xs">{session.user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}