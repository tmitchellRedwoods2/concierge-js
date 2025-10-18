'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PortfolioData {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceData {
  date: string;
  value: number;
  gain: number;
  gainPercent: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function PortfolioAnalytics() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioAnalytics();
  }, []);

  const fetchPortfolioAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production, fetch from API
      const mockData = {
        portfolio: {
          totalValue: 125430.50,
          totalGain: 15430.50,
          totalGainPercent: 14.02,
          dailyChange: 1250.30,
          dailyChangePercent: 1.01
        },
        allocation: [
          { name: 'Stocks', value: 75000, percentage: 59.8, color: '#0088FE' },
          { name: 'Bonds', value: 25000, percentage: 19.9, color: '#00C49F' },
          { name: 'Real Estate', value: 15000, percentage: 12.0, color: '#FFBB28' },
          { name: 'Commodities', value: 10000, percentage: 8.0, color: '#FF8042' },
          { name: 'Cash', value: 430.50, percentage: 0.3, color: '#8884D8' }
        ],
        performance: [
          { date: '2024-01-01', value: 110000, gain: 0, gainPercent: 0 },
          { date: '2024-02-01', value: 112500, gain: 2500, gainPercent: 2.27 },
          { date: '2024-03-01', value: 115000, gain: 5000, gainPercent: 4.55 },
          { date: '2024-04-01', value: 118000, gain: 8000, gainPercent: 7.27 },
          { date: '2024-05-01', value: 120000, gain: 10000, gainPercent: 9.09 },
          { date: '2024-06-01', value: 122500, gain: 12500, gainPercent: 11.36 },
          { date: '2024-07-01', value: 125430.50, gain: 15430.50, gainPercent: 14.02 }
        ]
      };

      setPortfolioData(mockData.portfolio);
      setAssetAllocation(mockData.allocation);
      setPerformanceData(mockData.performance);
    } catch (error) {
      console.error('Error fetching portfolio analytics:', error);
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
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Value</div>
            <div className="text-2xl font-bold">${portfolioData?.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Gain</div>
            <div className="text-2xl font-bold text-green-600">
              +${portfolioData?.totalGain.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">
              +{portfolioData?.totalGainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Daily Change</div>
            <div className="text-2xl font-bold text-green-600">
              +${portfolioData?.dailyChange.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">
              +{portfolioData?.dailyChangePercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Best Performer</div>
            <div className="text-2xl font-bold">AAPL</div>
            <div className="text-sm text-green-600">+8.5%</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assetAllocation.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: asset.color }}
                        ></div>
                        <span className="font-medium">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${asset.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{asset.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">6.2/10</div>
                <div className="text-sm text-gray-600">Moderate Risk</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">12.4%</div>
                <div className="text-sm text-gray-600">Annualized</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">1.8</div>
                <div className="text-sm text-gray-600">Risk-Adjusted Return</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
