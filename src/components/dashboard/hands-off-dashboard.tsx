/**
 * Hands-Off Client Dashboard
 * Minimal dashboard for clients who want a fully automated experience
 * Shows only essential information and AI agent interactions
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Bot
} from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'appointment' | 'message' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'action-required';
}

export default function HandsOffDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load upcoming appointments
      try {
        const calendarResponse = await fetch('/api/calendar/events?startDate=' + new Date().toISOString());
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          const upcoming = (calendarData.events || []).filter((event: any) => {
            if (!event || !event.startDate) return false;
            const eventDate = new Date(event.startDate);
            return eventDate >= new Date() && eventDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          });
          setUpcomingAppointments(upcoming.length);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }

      // Load recent activity (simplified - in production, this would come from an activity feed API)
      const activities: RecentActivity[] = [];
      
      // Add recent appointments
      try {
        const appointmentsResponse = await fetch('/api/calendar/events?limit=5');
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          (appointmentsData.events || []).slice(0, 3).forEach((event: any) => {
            if (event && event._id && event.title && event.startDate) {
              activities.push({
                id: event._id,
                type: 'appointment',
                title: event.title,
                description: `Scheduled for ${new Date(event.startDate).toLocaleDateString()}`,
                timestamp: event.createdAt || event.startDate,
                status: new Date(event.startDate) < new Date() ? 'completed' : 'pending'
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading recent appointments:', error);
      }

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'action-required':
        return <Badge variant="destructive">Action Required</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Your AI-powered concierge is handling everything for you. Sit back and relax.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              In the next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Action - AI Chat */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Chat with Your AI Concierge
          </CardTitle>
          <CardDescription>
            Ask questions, request assistance, or just check in. Your AI agent is always available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => router.push('/messages')}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Open AI Chat
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your AI concierge has been working on these items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No recent activity</p>
              <p className="text-sm mt-2">Your AI concierge will notify you when there's something to see</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Calendar Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={() => router.push('/calendar')}
            variant="outline"
            className="w-full"
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Your Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

