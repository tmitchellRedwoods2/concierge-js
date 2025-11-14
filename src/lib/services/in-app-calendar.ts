import { CalendarEvent } from '@/lib/models/CalendarEvent';

export interface CalendarEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    email: boolean;
    popup: boolean;
    minutes: number;
  };
  source?: 'workflow' | 'manual' | 'import';
  workflowExecutionId?: string;
}

export class InAppCalendarService {
  async createEvent(eventData: CalendarEventData, userId: string) {
    try {
      console.log('📅 Creating in-app calendar event:', eventData);
      
      const calendarEvent = new CalendarEvent({
        userId,
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        attendees: eventData.attendees,
        reminders: eventData.reminders || {
          email: true,
          popup: true,
          minutes: 15
        },
        status: 'confirmed',
        createdBy: 'ai',
        source: eventData.source || 'workflow',
        workflowExecutionId: eventData.workflowExecutionId
      });

      const savedEvent = await calendarEvent.save();
      console.log('✅ In-app calendar event created:', savedEvent._id);

      return {
        success: true,
        eventId: savedEvent._id.toString(),
        eventUrl: `/calendar/event/${savedEvent._id}`,
        event: savedEvent
      };
    } catch (error) {
      console.error('❌ Error creating in-app calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getEvents(userId: string, startDate?: Date, endDate?: Date) {
    try {
      console.log('📅 Fetching in-app calendar events for user:', userId);
      console.log('📅 Date range:', { startDate, endDate });
      
      // Ensure we're connected to the database
      const connectDB = (await import('@/lib/db/mongodb')).default;
      await connectDB();
      
      const query: any = { userId };
      
      if (startDate && endDate) {
        query.startDate = { $gte: startDate, $lte: endDate };
      }

      const events = await CalendarEvent.find(query)
        .sort({ startDate: 1 })
        .lean();

      console.log(`✅ Found ${events.length} in-app calendar events for user ${userId}`);
      console.log('📅 Event IDs:', events.map((e: any) => e._id));
      
      return {
        success: true,
        events: events
      };
    } catch (error) {
      console.error('❌ Error fetching in-app calendar events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events: []
      };
    }
  }

  async updateEvent(eventId: string, userId: string, updates: Partial<CalendarEventData>) {
    try {
      console.log('📅 Updating in-app calendar event:', eventId);
      
      const event = await CalendarEvent.findOneAndUpdate(
        { _id: eventId, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      console.log('✅ In-app calendar event updated:', event._id);
      
      return {
        success: true,
        event: event
      };
    } catch (error) {
      console.error('❌ Error updating in-app calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteEvent(eventId: string, userId: string) {
    try {
      console.log('📅 Deleting in-app calendar event:', eventId);
      
      const event = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });

      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      console.log('✅ In-app calendar event deleted:', event._id);
      
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting in-app calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
