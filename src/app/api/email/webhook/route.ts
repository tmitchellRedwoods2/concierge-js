import { NextRequest, NextResponse } from 'next/server';
import { emailParserService } from '@/lib/services/email-parser';
import { emailTriggerService } from '@/lib/services/email-trigger';
import { automationEngine } from '@/lib/services/automation-engine';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import connectDB from '@/lib/db/mongodb';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Email Webhook Endpoint
 * Receives emails from email services (SendGrid, Mailgun, etc.)
 * and automatically processes them to create calendar events
 * 
 * This endpoint should be public (no auth) as it receives webhooks from email services
 * Security is handled via webhook secret verification
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (add to env vars)
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.EMAIL_WEBHOOK_SECRET;
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Support multiple email service formats
    let emailData: {
      from: string;
      subject: string;
      body: string;
      userId?: string;
      to?: string;
    };

    // SendGrid format
    if (body.from && body.subject && (body.text || body.html)) {
      emailData = {
        from: body.from,
        subject: body.subject,
        body: body.text || body.html || '',
        to: body.to
      };
    }
    // Mailgun format
    else if (body['sender'] && body['subject'] && body['body-plain']) {
      emailData = {
        from: body['sender'],
        subject: body['subject'],
        body: body['body-plain'] || body['body-html'] || '',
        to: body.recipient
      };
    }
    // Generic format
    else if (body.from && body.subject && body.body) {
      emailData = {
        from: body.from,
        subject: body.subject,
        body: body.body,
        to: body.to
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // If userId is provided, use it; otherwise try to find user by email
    let userId = body.userId;
    if (!userId && emailData.to) {
      // TODO: Look up user by email address
      // For now, we'll require userId in the webhook payload
      // In production, you'd query your user database
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log(`📧 Received email from ${emailData.from} for user ${userId}`);

    // Parse appointment details from email
    const parsedAppointment = emailParserService.parseAppointmentEmail({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body
    });

    if (!parsedAppointment) {
      console.log('⚠️ Email does not appear to contain appointment information');
      
      // Still process through email trigger system for other automation rules
      await emailTriggerService.processEmail({
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        userId
      });

      return NextResponse.json({
        success: true,
        message: 'Email processed, but no appointment detected',
        appointmentCreated: false
      });
    }

    console.log(`✅ Parsed appointment: ${parsedAppointment.title} on ${parsedAppointment.startDate}`);

    // Check if event already exists (avoid duplicates)
    await connectDB();
    const existingEvent = await CalendarEvent.findOne({
      userId,
      startDate: parsedAppointment.startDate,
      title: { $regex: new RegExp(parsedAppointment.title, 'i') }
    });

    if (existingEvent) {
      console.log('⚠️ Event already exists, skipping creation');
      return NextResponse.json({
        success: true,
        message: 'Appointment already exists',
        appointmentCreated: false,
        eventId: existingEvent._id.toString()
      });
    }

    // Create calendar event
    const event = new CalendarEvent({
      title: parsedAppointment.title,
      startDate: parsedAppointment.startDate,
      endDate: parsedAppointment.endDate,
      location: parsedAppointment.location || '',
      description: parsedAppointment.description || '',
      userId,
      attendees: parsedAppointment.attendees || [],
      allDay: parsedAppointment.allDay || false,
      source: 'email',
      createdBy: userId,
      status: 'confirmed'
    });

    await event.save();
    const eventId = event._id.toString();

    console.log(`📅 Created calendar event: ${eventId}`);

    // Automatically add to Apple Calendar by generating ICS file URL
    // The user's device can download this automatically
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const icsUrl = `${baseUrl}/api/calendar/event/${eventId}/ics`;

    // Send notification to user
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
        userId,
        emailData.to || emailData.from,
        'User',
        `/calendar/event/${eventId}`
      );
    } catch (error) {
      console.error('⚠️ Failed to send notification:', error);
      // Continue even if notification fails
    }

    // Also process through email trigger system for other automation rules
    await emailTriggerService.processEmail({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment created successfully',
      appointmentCreated: true,
      eventId,
      icsUrl,
      appointment: {
        title: parsedAppointment.title,
        startDate: parsedAppointment.startDate.toISOString(),
        endDate: parsedAppointment.endDate.toISOString(),
        location: parsedAppointment.location,
        confidence: parsedAppointment.confidence
      }
    });

  } catch (error) {
    console.error('❌ Error processing email webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process email'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some email services require this)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Email webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

