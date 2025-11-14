'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Plus, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  source: 'workflow' | 'manual' | 'import' | 'email';
  workflowExecutionId?: string;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📅 Calendar page useEffect - status:', status, 'session:', session?.user?.id);
    if (status === 'loading') {
      console.log('📅 Still loading session...');
      return;
    }
    if (!session) {
      console.log('📅 No session, redirecting to login');
      window.location.href = '/login';
      return;
    }
    console.log('📅 Loading events for user:', session.user.id);
    loadEvents();
  }, [session, status]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar/events');
      if (!response.ok) {
        throw new Error('Failed to load calendar events');
      }
      
      const data = await response.json();
      console.log('📅 Calendar events API response:', data);
      console.log('📅 Response status:', response.status);
      console.log('📅 Response OK:', response.ok);
      
      // Handle both response formats: { events: [...] } or { success: true, events: [...] }
      let eventsList: any[] = [];
      if (data.events && Array.isArray(data.events)) {
        eventsList = data.events;
      } else if (data.success && data.events && Array.isArray(data.events)) {
        eventsList = data.events;
      } else if (Array.isArray(data)) {
        eventsList = data;
      }
      
      console.log('📅 Parsed events:', eventsList.length, 'events');
      console.log('📅 Events data:', eventsList);
      
      // Validate events have required fields before setting state
      const validEvents = eventsList.filter((event: any) => {
        const isValid = event && 
          event._id && 
          event.title && 
          event.startDate && 
          event.endDate && 
          event.status && 
          event.source;
        if (!isValid) {
          console.warn('⚠️ Invalid event found:', event);
        }
        return isValid;
      });
      
      console.log('📅 Valid events:', validEvents.length, 'out of', eventsList.length);
      setEvents(validEvents);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'workflow':
        return 'bg-blue-100 text-blue-800';
      case 'manual':
        return 'bg-purple-100 text-purple-800';
      case 'import':
        return 'bg-gray-100 text-gray-800';
      case 'email':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Calendar
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage your calendar events
              </p>
            </div>
            <Button
              onClick={() => router.push('/settings/calendar')}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Calendar Settings
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calendar events</h3>
              <p className="text-gray-600 mb-4">
                Your calendar events will appear here when you create them through workflows or manually.
              </p>
              <Button onClick={() => router.push('/workflows')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              // Additional safety check
              if (!event || !event._id || !event.title) {
                console.warn('⚠️ Skipping invalid event in render:', event);
                return null;
              }
              return (
              <Card key={event._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <Badge className={getSourceColor(event.source)}>
                        {event.source}
                      </Badge>
                    </div>
                  </div>
                  {event.description && (
                    <CardDescription className="mt-2">{event.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Start</p>
                        <p className="text-gray-600">{formatDate(event.startDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">End</p>
                        <p className="text-gray-600">{formatDate(event.endDate)}</p>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Location</p>
                          <p className="text-gray-600">{event.location}</p>
                        </div>
                      </div>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Attendees</p>
                          <div className="space-y-1">
                            {event.attendees.map((attendee, index) => (
                              <p key={index} className="text-gray-600">{attendee}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => router.push(`/calendar/event/${event._id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

