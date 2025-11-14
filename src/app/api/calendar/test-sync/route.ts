import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailParserService } from '@/lib/services/email-parser';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { CalendarSyncService } from '@/lib/services/calendar-sync';
import { NotificationService } from '@/lib/services/notification-service';
import connectDB from '@/lib/db/mongodb';

/**
 * Test Calendar Sync Endpoint
 * Allows users to test calendar sync functionality from the UI
 * Uses session authentication instead of webhook secret
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailContent } = body;

    await connectDB();

    // Create test email data
    const emailData = {
      from: emailContent?.from || 'test-doctor@example.com',
      subject: emailContent?.subject || 'Test Appointment - Calendar Sync',
      body: emailContent?.body || `This is a test appointment to verify calendar sync functionality. 
             Your appointment is scheduled for ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()} at 2:00 PM at Test Medical Center, 123 Test Street.`
    };

    console.log(`📧 Test email received from ${emailData.from} for user ${session.user.id}`);

    // Parse the email
    const parsedAppointment = emailParserService.parseAppointmentEmail(emailData);

    if (!parsedAppointment) {
      return NextResponse.json({
        success: false,
        message: 'Email does not appear to contain appointment information. Please include a date and time in your test email.'
      }, { status: 200 });
    }

    // Check for duplicates
    const existingEvent = await CalendarEvent.findOne({
      userId: session.user.id,
      title: parsedAppointment.title,
      startDate: parsedAppointment.startDate,
      endDate: parsedAppointment.endDate,
    });

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        message: 'Test event already exists (duplicate detected).',
        eventId: existingEvent._id.toString(),
        isDuplicate: true
      }, { status: 200 });
    }

    // Create calendar event
    const event = new CalendarEvent({
      title: parsedAppointment.title,
      startDate: parsedAppointment.startDate,
      endDate: parsedAppointment.endDate,
      location: parsedAppointment.location || '',
      description: parsedAppointment.description || '',
      userId: session.user.id,
      attendees: parsedAppointment.attendees || [],
      allDay: parsedAppointment.allDay || false,
      source: 'manual', // Use 'manual' for test events created from UI
      createdBy: session.user.id,
      status: 'confirmed'
    });

    await event.save();
    const eventId = event._id.toString();

    console.log(`📅 Created test calendar event: ${eventId}`);

    // Automatically sync to external calendar
    let syncResult = null;
    try {
      const calendarSyncService = new CalendarSyncService();
      syncResult = await calendarSyncService.syncEventIfEnabled(
        {
          _id: eventId,
          id: eventId,
          title: parsedAppointment.title,
          startDate: parsedAppointment.startDate.toISOString(),
          endDate: parsedAppointment.endDate.toISOString(),
          location: parsedAppointment.location || '',
          description: parsedAppointment.description || '',
          attendees: parsedAppointment.attendees || []
        },
        session.user.id
      );

      if (syncResult.success) {
        console.log(`📅 Test event automatically synced to external calendar: ${syncResult.externalEventId}`);
        // Update event with external calendar info
        if (syncResult.externalEventId && syncResult.calendarType) {
          if (syncResult.calendarType === 'google') {
            event.googleEventId = syncResult.externalEventId;
            event.googleEventUrl = syncResult.externalCalendarUrl;
          } else if (syncResult.calendarType === 'apple') {
            event.appleEventId = syncResult.externalEventId;
            event.appleEventUrl = syncResult.externalCalendarUrl;
          }
          await event.save();
        }
      } else {
        console.log(`⚠️ Calendar sync not enabled or failed (non-blocking): ${syncResult.error}`);
      }
    } catch (error) {
      console.error('⚠️ Calendar sync error (non-blocking):', error);
      // Don't throw - calendar sync failure shouldn't block event creation
    }

    // Generate ICS file URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const icsUrl = `${baseUrl}/api/calendar/event/${eventId}/ics`;

    // Send notification (optional for test)
    try {
      const notificationService = new NotificationService();
      await notificationService.sendAppointmentConfirmation(
        {
          _id: eventId,
          id: eventId,
          title: parsedAppointment.title,
          startDate: parsedAppointment.startDate.toISOString(),
          endDate: parsedAppointment.endDate.toISOString(),
          location: parsedAppointment.location,
          description: parsedAppointment.description,
          attendees: parsedAppointment.attendees
        },
        session.user.id,
        session.user.email || '',
        session.user.name || 'User',
        `/calendar/event/${eventId}`,
        icsUrl
      );
    } catch (error) {
      console.error('⚠️ Failed to send notification:', error);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Test appointment created successfully',
      appointmentCreated: true,
      eventId,
      icsUrl,
      syncResult: syncResult ? {
        success: syncResult.success,
        synced: syncResult.success,
        calendarType: syncResult.calendarType,
        externalEventId: syncResult.externalEventId,
        externalEventUrl: syncResult.externalEventUrl,
        error: syncResult.error
      } : null,
      appointment: {
        title: parsedAppointment.title,
        startDate: parsedAppointment.startDate.toISOString(),
        endDate: parsedAppointment.endDate.toISOString(),
        location: parsedAppointment.location,
        confidence: parsedAppointment.confidence
      }
    });

  } catch (error) {
    console.error('❌ Error processing test sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process test sync'
      },
      { status: 500 }
    );
  }
}

