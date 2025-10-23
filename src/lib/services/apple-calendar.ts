import { CalendarEvent } from '@/lib/models/CalendarEvent';

export interface AppleCalendarConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarPath: string;
}

export interface AppleCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

export class AppleCalendarService {
  private config: AppleCalendarConfig;

  constructor(config: AppleCalendarConfig) {
    this.config = config;
  }

  async createEvent(event: any, userId: string): Promise<{ success: boolean; eventId?: string; eventUrl?: string; error?: string }> {
    try {
      console.log('🍎 Creating Apple Calendar event:', event.title);
      
      // Generate unique UID for the event
      const uid = `concierge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create CalDAV event data
      const caldavEvent = this.createCalDAVEvent(event, uid);
      
      // Upload to CalDAV server
      const eventUrl = await this.uploadEventToCalDAV(caldavEvent, uid);
      
      if (eventUrl) {
        // Update the internal event with Apple Calendar info
        await CalendarEvent.findByIdAndUpdate(event._id, {
          appleEventId: uid,
          appleEventUrl: eventUrl
        });
        
        console.log('✅ Apple Calendar event created:', uid);
        
        return {
          success: true,
          eventId: uid,
          eventUrl: eventUrl
        };
      } else {
        return {
          success: false,
          error: 'Failed to upload event to Apple Calendar'
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Apple Calendar sync failed'
      };
    }
  }

  private createCalDAVEvent(event: any, uid: string): string {
    const startDate = this.formatCalDAVDate(event.startDate);
    const endDate = this.formatCalDAVDate(event.endDate);
    const now = this.formatCalDAVDate(new Date());
    
    const attendees = event.attendees?.map((email: string) => 
      `ATTENDEE:mailto:${email}`
    ).join('\n') || '';
    
    const location = event.location ? `LOCATION:${event.location}` : '';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Concierge AI//Calendar Integration//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
${location}
${attendees}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  }

  private formatCalDAVDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private async uploadEventToCalDAV(eventData: string, uid: string): Promise<string | null> {
    try {
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${uid}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: eventData
      });

      if (response.ok) {
        console.log('✅ Event uploaded to Apple Calendar:', eventUrl);
        return eventUrl;
      } else {
        console.error('❌ Failed to upload to Apple Calendar:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ CalDAV upload error:', error);
      return null;
    }
  }

  async getEvents(startDate?: Date, endDate?: Date): Promise<{ success: boolean; events?: AppleCalendarEvent[]; error?: string }> {
    try {
      console.log('🍎 Fetching Apple Calendar events...');
      
      const response = await fetch(`${this.config.serverUrl}${this.config.calendarPath}/`, {
        method: 'REPORT',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: this.createCalDAVQuery(startDate, endDate)
      });

      if (response.ok) {
        const events = await this.parseCalDAVResponse(await response.text());
        console.log(`✅ Found ${events.length} Apple Calendar events`);
        
        return {
          success: true,
          events: events
        };
      } else {
        return {
          success: false,
          error: `Failed to fetch events: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events'
      };
    }
  }

  private createCalDAVQuery(startDate?: Date, endDate?: Date): string {
    const start = startDate ? this.formatCalDAVDate(startDate) : '';
    const end = endDate ? this.formatCalDAVDate(endDate) : '';
    
    return `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        ${start ? `<C:time-range start="${start}" end="${end}"/>` : ''}
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
  }

  private async parseCalDAVResponse(responseText: string): Promise<AppleCalendarEvent[]> {
    // This is a simplified parser - in production, you'd want a proper CalDAV parser
    const events: AppleCalendarEvent[] = [];
    
    // Basic parsing logic here
    // In a real implementation, you'd parse the CalDAV XML response
    
    return events;
  }

  async updateEvent(eventId: string, event: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🍎 Updating Apple Calendar event:', eventId);
      
      const caldavEvent = this.createCalDAVEvent(event, eventId);
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${eventId}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: caldavEvent
      });

      if (response.ok) {
        console.log('✅ Apple Calendar event updated:', eventId);
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to update event: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🍎 Deleting Apple Calendar event:', eventId);
      
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${eventId}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        }
      });

      if (response.ok) {
        console.log('✅ Apple Calendar event deleted:', eventId);
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to delete event: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }
}
