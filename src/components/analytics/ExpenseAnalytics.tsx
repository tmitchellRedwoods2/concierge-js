'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ExpenseData {
  totalExpenses: number;
  monthlyBudget: number;
  remainingBudget: number;
  averageDaily: number;
  topCategory: string;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface MonthlyData {
  month: string;
  amount: number;
  budget: number;
  variance: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

export default function ExpenseAnalytics() {
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseAnalytics();
  }, []);

  const fetchExpenseAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production, fetch from API
      const mockData = {
        expenses: {
          totalExpenses: 3240.50,
          monthlyBudget: 5000,
          remainingBudget: 1759.50,
          averageDaily: 108.02,
          topCategory: 'Food & Dining'
        },
        categories: [
          { name: 'Food & Dining', amount: 1200, percentage: 37.0, color: '#FF6B6B', trend: 'up' },
          { name: 'Transportation', amount: 800, percentage: 24.7, color: '#4ECDC4', trend: 'down' },
          { name: 'Entertainment', amount: 600, percentage: 18.5, color: '#45B7D1', trend: 'stable' },
          { name: 'Shopping', amount: 400, percentage: 12.3, color: '#96CEB4', trend: 'up' },
          { name: 'Utilities', amount: 240.50, percentage: 7.4, color: '#FFEAA7', trend: 'stable' }
        ],
        monthly: [
          { month: 'Jan', amount: 2800, budget: 5000, variance: -2200 },
          { month: 'Feb', amount: 3200, budget: 5000, variance: -1800 },
          { month: 'Mar', amount: 3100, budget: 5000, variance: -1900 },
          { month: 'Apr', amount: 3400, budget: 5000, variance: -1600 },
          { month: 'May', amount: 3600, budget: 5000, variance: -1400 },
          { month: 'Jun', amount: 3240.50, budget: 5000, variance: -1759.50 }
        ]
      };

      setExpenseData(mockData.expenses);
      setCategoryData(mockData.categories);
      setMonthlyData(mockData.monthly);
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold">${expenseData?.totalExpenses.toLocaleString()}</div>
            <div className="text-sm text-gray-600">This month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Monthly Budget</div>
            <div className="text-2xl font-bold">${expenseData?.monthlyBudget.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Budget limit</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Remaining</div>
            <div className="text-2xl font-bold text-green-600">
              ${expenseData?.remainingBudget.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">
              {((expenseData?.remainingBudget || 0) / (expenseData?.monthlyBudget || 1) * 100).toFixed(1)}% left
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Daily Average</div>
            <div className="text-2xl font-bold">${expenseData?.averageDaily.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Per day</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          category.trend === 'up' ? 'bg-red-100 text-red-600' :
                          category.trend === 'down' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {category.trend === 'up' ? '↗' : category.trend === 'down' ? '↘' : '→'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${category.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#FF6B6B" 
                      strokeWidth={2}
                      dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      stroke="#4ECDC4" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Used</span>
                    <span className="text-sm font-bold">
                      {((expenseData?.totalExpenses || 0) / (expenseData?.monthlyBudget || 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${((expenseData?.totalExpenses || 0) / (expenseData?.monthlyBudget || 1) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    ${expenseData?.totalExpenses.toLocaleString()} of ${expenseData?.monthlyBudget.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {((expenseData?.remainingBudget || 0) / (expenseData?.monthlyBudget || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  ${expenseData?.remainingBudget.toLocaleString()} remaining
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
