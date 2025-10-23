import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';
import { NotificationService } from '@/lib/services/notification-service';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, eventData, eventId, sendNotifications = true, recipientEmail, recipientName } = body;

    const calendarService = new CalendarService();
    const notificationService = new NotificationService();

    switch (action) {
      case 'create':
        if (!eventData) {
          return NextResponse.json({ error: 'Event data is required' }, { status: 400 });
        }

        const appointmentEvent = createAppointmentEvent(eventData);
        const result = await calendarService.createEvent(appointmentEvent, 'primary', session.user.id);

        if (result.success) {
          // Send notification if requested
          if (sendNotifications && recipientEmail) {
            try {
              const notificationResult = await notificationService.sendAppointmentConfirmation(
                {
                  _id: result.eventId,
                  title: eventData.title,
                  description: eventData.description,
                  startDate: eventData.date + 'T' + eventData.time,
                  endDate: new Date(new Date(eventData.date + 'T' + eventData.time).getTime() + (eventData.duration || 60) * 60000).toISOString(),
                  location: eventData.location,
                  attendees: eventData.attendee ? [eventData.attendee] : [],
                },
                session.user.id,
                recipientEmail,
                recipientName
              );

              if (notificationResult.success) {
                console.log('✅ Appointment confirmation sent');
              } else {
                console.log('⚠️ Failed to send confirmation:', notificationResult.error);
              }
            } catch (notificationError) {
              console.log('⚠️ Notification error (non-blocking):', notificationError);
            }
          }

          return NextResponse.json({
            success: true,
            eventId: result.eventId,
            eventUrl: result.eventUrl,
            message: 'Event created successfully',
            notificationSent: sendNotifications && recipientEmail,
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
          // Send modification notification if requested
          if (sendNotifications && recipientEmail) {
            try {
              const notificationResult = await notificationService.sendAppointmentModification(
                {
                  _id: eventId,
                  title: eventData.title || eventData.summary,
                  description: eventData.description,
                  startDate: eventData.start?.dateTime || eventData.startDate,
                  endDate: eventData.end?.dateTime || eventData.endDate,
                  location: eventData.location,
                  attendees: eventData.attendees,
                },
                session.user.id,
                recipientEmail,
                recipientName
              );

              if (notificationResult.success) {
                console.log('✅ Appointment modification sent');
              } else {
                console.log('⚠️ Failed to send modification notification:', notificationResult.error);
              }
            } catch (notificationError) {
              console.log('⚠️ Notification error (non-blocking):', notificationError);
            }
          }

          return NextResponse.json({
            success: true,
            eventId: updateResult.eventId,
            eventUrl: updateResult.eventUrl,
            message: 'Event updated successfully',
            notificationSent: sendNotifications && recipientEmail,
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
          // Send cancellation notification if requested
          if (sendNotifications && recipientEmail) {
            try {
              // Note: For delete, we might not have the full event data
              // In a real implementation, you'd fetch the event before deleting
              const notificationResult = await notificationService.sendAppointmentCancellation(
                {
                  _id: eventId,
                  title: eventData?.title || 'Appointment',
                  description: eventData?.description,
                  startDate: eventData?.startDate || new Date(),
                  endDate: eventData?.endDate || new Date(),
                  location: eventData?.location,
                  attendees: eventData?.attendees,
                },
                session.user.id,
                recipientEmail,
                recipientName
              );

              if (notificationResult.success) {
                console.log('✅ Appointment cancellation sent');
              } else {
                console.log('⚠️ Failed to send cancellation notification:', notificationResult.error);
              }
            } catch (notificationError) {
              console.log('⚠️ Notification error (non-blocking):', notificationError);
            }
          }

          return NextResponse.json({
            success: true,
            message: 'Event deleted successfully',
            notificationSent: sendNotifications && recipientEmail,
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
