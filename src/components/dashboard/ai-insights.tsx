"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  DollarSign,
  Heart,
  Shield,
  RefreshCw
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'opportunity' | 'optimization';
  category: 'financial' | 'health' | 'insurance' | 'legal' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  impact?: string;
  confidence: number;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAIInsights();
  }, []);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      // Simulate AI insights generation
      // In a real implementation, this would call an AI service
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'recommendation',
          category: 'financial',
          title: 'Portfolio Rebalancing Opportunity',
          description: 'Your portfolio is 15% overweight in technology stocks. Consider rebalancing to maintain your target allocation.',
          priority: 'medium',
          action: 'Rebalance Portfolio',
          impact: 'Risk reduction and improved diversification',
          confidence: 87
        },
        {
          id: '2',
          type: 'alert',
          category: 'health',
          title: 'Prescription Refill Reminder',
          description: 'Your blood pressure medication will run out in 3 days. Schedule a refill to avoid interruption.',
          priority: 'high',
          action: 'Schedule Refill',
          impact: 'Maintains consistent medication schedule',
          confidence: 95
        },
        {
          id: '3',
          type: 'optimization',
          category: 'financial',
          title: 'Expense Optimization',
          description: 'You spent 23% more on dining out this month. Consider meal planning to reduce costs.',
          priority: 'low',
          action: 'View Budget',
          impact: 'Potential savings of $200-300/month',
          confidence: 78
        },
        {
          id: '4',
          type: 'opportunity',
          category: 'insurance',
          title: 'Insurance Coverage Gap',
          description: 'Your auto insurance deductible is higher than recommended for your income level.',
          priority: 'medium',
          action: 'Review Policy',
          impact: 'Better financial protection',
          confidence: 82
        },
        {
          id: '5',
          type: 'recommendation',
          category: 'health',
          title: 'Annual Checkup Due',
          description: 'It\'s been 11 months since your last physical. Schedule your annual checkup.',
          priority: 'medium',
          action: 'Schedule Appointment',
          impact: 'Preventive healthcare maintenance',
          confidence: 90
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity': return <Target className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'health': return <Heart className="w-4 h-4" />;
      case 'insurance': return <Shield className="w-4 h-4" />;
      case 'legal': return <Shield className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recommendation': return 'text-blue-600';
      case 'alert': return 'text-red-600';
      case 'opportunity': return 'text-green-600';
      case 'optimization': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Generating insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Insights
          </div>
          <Button size="sm" variant="outline" onClick={loadAIInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Personalized recommendations powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${getTypeColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className={`p-1 rounded text-gray-600`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                    {insight.priority}
                  </Badge>
                  <span className="text-xs text-gray-500">{insight.confidence}%</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              
              {insight.impact && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-700">Impact: </span>
                  <span className="text-xs text-gray-600">{insight.impact}</span>
                </div>
              )}
              
              {insight.action && (
                <Button size="sm" variant="outline" className="text-xs">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No insights available at the moment.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
