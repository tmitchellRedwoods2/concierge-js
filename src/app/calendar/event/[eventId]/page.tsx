import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { notFound, redirect } from 'next/navigation';
import AppleCalendarButton from '@/components/calendar/AppleCalendarButton';

interface CalendarEventPageProps {
  params: {
    eventId: string;
  };
}

export default async function CalendarEventPage({ params }: CalendarEventPageProps) {
  await connectDB();

  try {
    // Allow public access to calendar events - no authentication required
    const event = await CalendarEvent.findOne({ 
      _id: params.eventId
    });

    if (!event) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
              <p className="text-blue-100 mt-1">Calendar Event</p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Details */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900">{event.title}</p>
                    </div>

                    {event.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900">{event.description}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date & Time</label>
                      <p className="text-gray-900">
                        {new Date(event.startDate).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date & Time</label>
                      <p className="text-gray-900">
                        {new Date(event.endDate).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </p>
                    </div>

                    {event.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-gray-900">{event.location}</p>
                      </div>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Attendees</label>
                        <div className="space-y-1">
                          {event.attendees.map((attendee, index) => (
                            <p key={index} className="text-gray-900">{attendee}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Status & Actions */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Status & Actions</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : event.status === 'tentative'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Source</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.source === 'workflow' 
                          ? 'bg-blue-100 text-blue-800' 
                          : event.source === 'manual'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.source.charAt(0).toUpperCase() + event.source.slice(1)}
                      </span>
                    </div>

                    {event.workflowExecutionId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Workflow Execution ID</label>
                        <p className="text-gray-900 font-mono text-sm">{event.workflowExecutionId}</p>
                      </div>
                    )}

                    {event.googleEventId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Google Calendar Event ID</label>
                        <p className="text-gray-900 font-mono text-sm">{event.googleEventId}</p>
                      </div>
                    )}

                    {event.googleEventUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Google Calendar Link</label>
                        <a 
                          href={event.googleEventUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View in Google Calendar
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Reminders */}
                  {event.reminders && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reminders</label>
                      <div className="space-y-1">
                        {event.reminders.email && (
                          <p className="text-sm text-gray-900">📧 Email reminder</p>
                        )}
                        {event.reminders.popup && (
                          <p className="text-sm text-gray-900">🔔 Popup reminder</p>
                        )}
                        <p className="text-sm text-gray-900">
                          {event.reminders.minutes} minutes before
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <AppleCalendarButton
                    eventId={params.eventId}
                    appleEventUrl={event.appleEventUrl}
                    event={{
                      title: event.title,
                      startDate: event.startDate,
                      endDate: event.endDate,
                      location: event.location,
                      description: event.description,
                      attendees: event.attendees
                    }}
                  />
                  <a 
                    href="/calendar" 
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    View All Events
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    notFound();
  }
}
