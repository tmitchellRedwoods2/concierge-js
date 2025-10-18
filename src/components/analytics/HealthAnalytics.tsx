'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HealthMetrics {
  overallScore: number;
  activeDays: number;
  totalSteps: number;
  avgHeartRate: number;
  sleepScore: number;
  stressLevel: number;
}

interface VitalData {
  date: string;
  heartRate: number;
  bloodPressure: string;
  weight: number;
  sleepHours: number;
}

interface ActivityData {
  day: string;
  steps: number;
  calories: number;
  activeMinutes: number;
}

export default function HealthAnalytics() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [vitalData, setVitalData] = useState<VitalData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthAnalytics();
  }, []);

  const fetchHealthAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production, fetch from API
      const mockData = {
        metrics: {
          overallScore: 85,
          activeDays: 22,
          totalSteps: 156780,
          avgHeartRate: 72,
          sleepScore: 78,
          stressLevel: 3.2
        },
        vitals: [
          { date: '2024-01-01', heartRate: 68, bloodPressure: '120/80', weight: 175, sleepHours: 7.5 },
          { date: '2024-01-02', heartRate: 72, bloodPressure: '118/78', weight: 174.5, sleepHours: 8.0 },
          { date: '2024-01-03', heartRate: 70, bloodPressure: '122/82', weight: 175.2, sleepHours: 7.0 },
          { date: '2024-01-04', heartRate: 75, bloodPressure: '119/79', weight: 174.8, sleepHours: 7.8 },
          { date: '2024-01-05', heartRate: 69, bloodPressure: '121/81', weight: 175.0, sleepHours: 8.2 },
          { date: '2024-01-06', heartRate: 73, bloodPressure: '117/77', weight: 174.6, sleepHours: 7.3 },
          { date: '2024-01-07', heartRate: 71, bloodPressure: '120/80', weight: 175.1, sleepHours: 7.9 }
        ],
        activity: [
          { day: 'Mon', steps: 8500, calories: 2100, activeMinutes: 45 },
          { day: 'Tue', steps: 12000, calories: 2400, activeMinutes: 60 },
          { day: 'Wed', steps: 9500, calories: 2200, activeMinutes: 50 },
          { day: 'Thu', steps: 11000, calories: 2300, activeMinutes: 55 },
          { day: 'Fri', steps: 8000, calories: 2000, activeMinutes: 40 },
          { day: 'Sat', steps: 15000, calories: 2800, activeMinutes: 75 },
          { day: 'Sun', steps: 7000, calories: 1900, activeMinutes: 35 }
        ]
      };

      setHealthMetrics(mockData.metrics);
      setVitalData(mockData.vitals);
      setActivityData(mockData.activity);
    } catch (error) {
      console.error('Error fetching health analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Overall Health Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(healthMetrics?.overallScore || 0)}`}>
              {healthMetrics?.overallScore}/100
            </div>
            <div className={`text-sm px-2 py-1 rounded-full inline-block mt-2 ${getScoreBgColor(healthMetrics?.overallScore || 0)}`}>
              {healthMetrics?.overallScore && healthMetrics.overallScore >= 80 ? 'Excellent' : 
               healthMetrics?.overallScore && healthMetrics.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Active Days</div>
            <div className="text-2xl font-bold">{healthMetrics?.activeDays}/30</div>
            <div className="text-sm text-gray-600">This month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Steps</div>
            <div className="text-2xl font-bold">{healthMetrics?.totalSteps.toLocaleString()}</div>
            <div className="text-sm text-gray-600">This month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600">Avg Heart Rate</div>
            <div className="text-2xl font-bold">{healthMetrics?.avgHeartRate} bpm</div>
            <div className="text-sm text-gray-600">Resting</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sleep">Sleep & Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Heart Rate Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="heartRate" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vitalData.slice(-5).reverse().map((vital, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{vital.date}</div>
                        <div className="text-sm text-gray-600">{vital.bloodPressure}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{vital.heartRate} bpm</div>
                        <div className="text-sm text-gray-600">{vital.weight} lbs</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'steps' ? value.toLocaleString() : value,
                        name === 'steps' ? 'Steps' : name === 'calories' ? 'Calories' : 'Active Minutes'
                      ]}
                    />
                    <Bar dataKey="steps" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sleep Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(healthMetrics?.sleepScore || 0)}`}>
                  {healthMetrics?.sleepScore}/100
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Average: 7.8 hours/night
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stress Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">
                  {healthMetrics?.stressLevel}/10
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Moderate stress
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sleep Hours Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value} hours`, 'Sleep']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sleepHours" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
