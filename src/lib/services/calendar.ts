import { google } from 'googleapis';

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

export class CalendarService {
  private auth: any;
  private calendar: any;

  constructor() {
    // Initialize Google Calendar API with robust private key handling
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

    // Handle different private key formats
    if (privateKey) {
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Ensure the key has proper BEGIN/END markers
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('❌ Invalid private key format: Missing BEGIN marker');
      }
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error('❌ Invalid private key format: Missing END marker');
      }
    }

    console.log('🔧 Calendar Service Initialization:');
    console.log('📧 Client Email:', clientEmail ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key:', privateKey ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key Length:', privateKey?.length || 0);

    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createEvent(eventData: CalendarEvent, calendarId: string = 'primary') {
    try {
      console.log('Creating calendar event:', eventData);
      
      const event = await this.calendar.events.insert({
        calendarId,
        resource: {
          summary: eventData.summary,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          attendees: eventData.attendees,
          location: eventData.location,
          reminders: eventData.reminders || {
            useDefault: true,
          },
        },
      });

      console.log('Event created:', event.data);
      return {
        success: true,
        eventId: event.data.id,
        eventUrl: event.data.htmlLink,
        event: event.data,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const event = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: eventData,
      });

      return {
        success: true,
        eventId: event.data.id,
        eventUrl: event.data.htmlLink,
        event: event.data,
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      return {
        success: true,
        message: 'Event deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listEvents(calendarId: string = 'primary', maxResults: number = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return {
        success: true,
        events: response.data.items || [],
      };
    } catch (error) {
      console.error('Error listing calendar events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events: [],
      };
    }
  }
}

// Helper function to create appointment event data
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
