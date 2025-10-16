import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, eventData, eventId } = body;

    const calendarService = new CalendarService();

    switch (action) {
      case 'create':
        if (!eventData) {
          return NextResponse.json({ error: 'Event data is required' }, { status: 400 });
        }

        const appointmentEvent = createAppointmentEvent(eventData);
        const result = await calendarService.createEvent(appointmentEvent);

        if (result.success) {
          return NextResponse.json({
            success: true,
            eventId: result.eventId,
            eventUrl: result.eventUrl,
            message: 'Event created successfully',
          });
        } else {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

      case 'update':
        if (!eventId || !eventData) {
          return NextResponse.json({ error: 'Event ID and data are required' }, { status: 400 });
        }

        const updateResult = await calendarService.updateEvent(eventId, eventData);
        
        if (updateResult.success) {
          return NextResponse.json({
            success: true,
            eventId: updateResult.eventId,
            eventUrl: updateResult.eventUrl,
            message: 'Event updated successfully',
          });
        } else {
          return NextResponse.json(
            { error: updateResult.error },
            { status: 500 }
          );
        }

      case 'delete':
        if (!eventId) {
          return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const deleteResult = await calendarService.deleteEvent(eventId);
        
        if (deleteResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Event deleted successfully',
          });
        } else {
          return NextResponse.json(
            { error: deleteResult.error },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    const calendarService = new CalendarService();
    const result = await calendarService.listEvents('primary', maxResults);

    if (result.success) {
      return NextResponse.json({
        success: true,
        events: result.events,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
