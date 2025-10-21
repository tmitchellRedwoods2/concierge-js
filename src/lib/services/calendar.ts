import { google } from 'googleapis';
import { FallbackCalendarService } from './calendar-fallback';

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
  private fallbackService: FallbackCalendarService;

  constructor() {
    // Initialize Google Calendar API with robust private key handling
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

    console.log('🔧 Calendar Service Initialization:');
    console.log('📧 Client Email:', clientEmail ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key:', privateKey ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key Length:', privateKey?.length || 0);

    // Handle different private key formats with comprehensive attempts
    if (privateKey) {
      console.log('🔧 Original private key length:', privateKey.length);
      console.log('🔧 Original private key preview:', privateKey.substring(0, 50) + '...');
      console.log('🔧 Original private key contains \\n:', privateKey.includes('\\n'));
      console.log('🔧 Original private key contains actual newlines:', privateKey.includes('\n'));
      
      // Try multiple formatting approaches
      let formattedKey = privateKey;
      let methodUsed = 'none';
      
      // Method 1: Replace escaped newlines with actual newlines
      if (privateKey.includes('\\n')) {
        formattedKey = privateKey.replace(/\\n/g, '\n');
        methodUsed = 'Method 1: Replaced \\n with actual newlines';
        console.log('🔧', methodUsed);
      }
      
      // Method 2: If it's all on one line, try to add newlines at markers
      else if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        formattedKey = privateKey
          .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
          .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        methodUsed = 'Method 2: Added newlines at markers';
        console.log('🔧', methodUsed);
      }
      
      // Method 3: If it has actual newlines but wrong format, fix it
      else if (privateKey.includes('\n')) {
        // Already has newlines, use as-is
        formattedKey = privateKey;
        methodUsed = 'Method 3: Using existing newlines';
        console.log('🔧', methodUsed);
      }
      
      // Method 4: Force format the key if it's malformed
      else if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && privateKey.includes('-----END PRIVATE KEY-----')) {
        // Try to fix common formatting issues
        formattedKey = privateKey
          .replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n')
          .replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
          .replace(/\n\n+/g, '\n'); // Remove multiple newlines
        methodUsed = 'Method 4: Force formatted key';
        console.log('🔧', methodUsed);
      }
      
      privateKey = formattedKey;
      
      // Comprehensive validation
      console.log('🔧 Final key length:', privateKey.length);
      console.log('🔧 Final key has newlines:', privateKey.includes('\n'));
      console.log('🔧 Final key has BEGIN marker:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
      console.log('🔧 Final key has END marker:', privateKey.includes('-----END PRIVATE KEY-----'));
      console.log('🔧 Method used:', methodUsed);
      
      // Validate the key format
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('❌ Invalid private key format: Missing BEGIN marker');
        console.error('❌ Key preview:', privateKey.substring(0, 100));
        console.error('❌ Full key for debugging:', privateKey);
      }
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error('❌ Invalid private key format: Missing END marker');
        console.error('❌ Key preview:', privateKey.substring(privateKey.length - 100));
        console.error('❌ Full key for debugging:', privateKey);
      }
      
      // Additional validation: check if key looks like a proper PEM format
      const keyLines = privateKey.split('\n');
      console.log('🔧 Key has', keyLines.length, 'lines');
      console.log('🔧 First line:', keyLines[0]);
      console.log('🔧 Last line:', keyLines[keyLines.length - 1]);
    }

    // Try to initialize Google Auth with error handling
    try {
      console.log('🔧 Attempting to initialize Google Auth...');
      
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      console.log('🔧 Google Auth initialized, creating calendar service...');
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      console.log('✅ Google Calendar service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Calendar service:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Check if it's the decoder error we've been fighting
      if (error instanceof Error && error.message.includes('DECODER routines::unsupported')) {
        console.log('🔧 Decoder error detected - switching to fallback mode');
      }
      
      // Set to null to indicate fallback mode
      this.auth = null;
      this.calendar = null;
      
      console.log('🔄 Calendar service will use fallback mode');
    }

    // Always initialize fallback service as backup
    this.fallbackService = new FallbackCalendarService();
  }

  async createEvent(eventData: CalendarEvent, calendarId: string = 'primary') {
    try {
      console.log('Creating calendar event:', eventData);
      console.log('Calendar service initialized:', !!this.calendar);
      console.log('Auth configured:', !!this.auth);
      
      // Check if we're in fallback mode (auth/calendar is null)
      if (!this.auth || !this.calendar) {
        console.log('🔄 Calendar service in fallback mode - using fallback service');
        return this.fallbackService.createEvent(eventData, calendarId);
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Calendar API timeout after 15 seconds')), 15000)
      );
      
      const createPromise = this.calendar.events.insert({
        calendarId,
        resource: {
          summary: eventData.summary,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          attendees: eventData.attendees,
          location: eventData.location,
        reminders: eventData.reminders || {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'email', minutes: 60 },
          ],
        },
        },
      });

      const event = await Promise.race([createPromise, timeoutPromise]);
      console.log('Event created successfully:', event.data);
      return {
        success: true,
        eventId: event.data.id,
        eventUrl: event.data.htmlLink,
        event: event.data,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // If it's a private key error, provide a helpful fallback
      if (error instanceof Error && error.message.includes('DECODER routines::unsupported')) {
        console.log('🔧 Private key format error detected - using fallback service');
        return this.fallbackService.createEvent(eventData, calendarId);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private createFallbackEvent(eventData: CalendarEvent) {
    const mockEventId = `mock_${Date.now()}`;
    
    console.log('🎭 Creating fallback mock calendar event:', {
      id: mockEventId,
      summary: eventData.summary,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end
    });
    
    return {
      success: true,
      eventId: mockEventId,
      eventUrl: 'https://calendar.google.com',
      event: {
        id: mockEventId,
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        location: eventData.location,
        htmlLink: 'https://calendar.google.com',
        created: new Date().toISOString(),
        status: 'confirmed'
      },
      message: 'Mock calendar event created (Google Calendar API unavailable - decoder error)'
    };
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
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 },
      ],
    },
  };
}
