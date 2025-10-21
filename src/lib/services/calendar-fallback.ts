// Fallback Calendar Service - Bypasses Google APIs library entirely
// This service provides mock calendar functionality when the real Google Calendar API fails

interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class FallbackCalendarService {
  private mockEvents: Map<string, any> = new Map();

  constructor() {
    console.log('🎭 Fallback Calendar Service initialized');
    console.log('📝 This service provides mock calendar functionality');
    console.log('🔄 Real Google Calendar API is unavailable due to decoder error');
  }

  async createEvent(eventData: CalendarEvent, calendarId: string = 'primary') {
    try {
      console.log('🎭 Creating mock calendar event:', eventData);
      
      const mockEventId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const mockEvent = {
        id: mockEventId,
        summary: eventData.summary,
        description: eventData.description || '',
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees || [],
        location: eventData.location || '',
        reminders: eventData.reminders || { useDefault: true },
        htmlLink: `https://calendar.google.com/event?eid=${mockEventId}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: 'confirmed',
        creator: {
          email: 'concierge-ai@example.com',
          displayName: 'Concierge AI Assistant'
        },
        organizer: {
          email: 'concierge-ai@example.com',
          displayName: 'Concierge AI Assistant'
        }
      };

      // Store the mock event
      this.mockEvents.set(mockEventId, mockEvent);
      
      console.log('✅ Mock calendar event created successfully:', mockEventId);
      console.log('📅 Event details:', {
        id: mockEventId,
        summary: eventData.summary,
        start: eventData.start.dateTime,
        end: eventData.end.dateTime,
        attendees: eventData.attendees?.length || 0
      });
      
      return {
        success: true,
        eventId: mockEventId,
        eventUrl: mockEvent.htmlLink,
        event: mockEvent,
        message: 'Mock calendar event created (Google Calendar API unavailable - decoder error)'
      };
    } catch (error) {
      console.error('❌ Error creating mock calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const existingEvent = this.mockEvents.get(eventId);
      if (!existingEvent) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const updatedEvent = {
        ...existingEvent,
        ...eventData,
        updated: new Date().toISOString(),
      };

      this.mockEvents.set(eventId, updatedEvent);
      
      console.log('✅ Mock calendar event updated:', eventId);
      
      return {
        success: true,
        eventId: updatedEvent.id,
        eventUrl: updatedEvent.htmlLink,
        event: updatedEvent,
      };
    } catch (error) {
      console.error('❌ Error updating mock calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary') {
    try {
      const deleted = this.mockEvents.delete(eventId);
      
      if (deleted) {
        console.log('✅ Mock calendar event deleted:', eventId);
        return {
          success: true,
          message: 'Event deleted successfully',
        };
      } else {
        return {
          success: false,
          error: 'Event not found',
        };
      }
    } catch (error) {
      console.error('❌ Error deleting mock calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listEvents(calendarId: string = 'primary', maxResults: number = 10) {
    try {
      const events = Array.from(this.mockEvents.values())
        .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
        .slice(0, maxResults);
      
      console.log(`📅 Retrieved ${events.length} mock calendar events`);
      
      return {
        success: true,
        events: events,
      };
    } catch (error) {
      console.error('❌ Error listing mock calendar events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events: [],
      };
    }
  }

  // Get all mock events (for debugging)
  getAllMockEvents() {
    return Array.from(this.mockEvents.values());
  }

  // Clear all mock events (for testing)
  clearAllEvents() {
    this.mockEvents.clear();
    console.log('🧹 All mock calendar events cleared');
  }
}

// Helper function to create appointment event data (same as original)
export function createAppointmentEvent(appointmentData: {
  title: string;
  date: string;
  time: string;
  duration?: number;
  attendee?: string;
  location?: string;
  description?: string;
}): CalendarEvent {
  const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
  const duration = appointmentData.duration || 60; // Default 60 minutes
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  return {
    summary: appointmentData.title,
    description: appointmentData.description || `Appointment scheduled via AI workflow`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/Los_Angeles', // Default timezone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: appointmentData.attendee ? [
      {
        email: appointmentData.attendee,
        displayName: appointmentData.attendee,
      }
    ] : undefined,
    location: appointmentData.location,
    reminders: {
      useDefault: true,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 },
      ],
    },
  };
}
