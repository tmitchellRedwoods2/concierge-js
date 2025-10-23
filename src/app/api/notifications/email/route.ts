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
    const { action, notificationData } = body;

    const emailService = new EmailNotificationService();

    switch (action) {
      case 'send_calendar_notification':
        if (!notificationData) {
          return NextResponse.json({ error: 'Notification data is required' }, { status: 400 });
        }

        const result = await emailService.sendCalendarNotification(notificationData as CalendarEventNotification);

        if (result.success) {
          return NextResponse.json({
            success: true,
            messageId: result.messageId,
            message: 'Email notification sent successfully',
          });
        } else {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

      case 'test_connection':
        const testResult = await emailService.testConnection();
        
        if (testResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Email service connection successful',
          });
        } else {
          return NextResponse.json(
            { error: testResult.error },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Email notification API error:', error);
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
    });

  } catch (error) {
    console.error('Email service status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
