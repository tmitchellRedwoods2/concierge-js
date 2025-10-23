import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { EmailNotificationService, CalendarEventNotification } from '@/lib/services/email-notification';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientEmail, recipientName, testType = 'appointment_confirmation' } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const emailService = new EmailNotificationService();

    // Create a test notification
    const testNotification: CalendarEventNotification = {
      eventId: 'test-' + Date.now(),
      title: 'Test Appointment - Doctor Visit',
      description: 'This is a test appointment to verify email notifications are working correctly.',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      location: '123 Main St, City, State 12345',
      attendees: [recipientEmail],
      reminderType: testType as any,
      recipientEmail,
      recipientName: recipientName || 'Test User',
    };

    console.log('🧪 Sending test email notification...');
    const result = await emailService.sendCalendarNotification(testNotification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        testType,
        recipientEmail,
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error,
          message: 'Failed to send test email',
          testType,
          recipientEmail,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email API error:', error);
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

    const emailService = new EmailNotificationService();
    const testResult = await emailService.testConnection();

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Email service is configured and ready' : 'Email service configuration issue',
      error: testResult.error,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    });

  } catch (error) {
    console.error('Email service status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
