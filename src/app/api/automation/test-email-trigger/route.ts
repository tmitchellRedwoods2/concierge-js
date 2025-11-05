import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailTriggerService } from '@/lib/services/email-trigger';

// POST /api/automation/test-email-trigger - Test email trigger processing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { from, subject, body: emailBody } = body;

    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      );
    }

    // Process the test email
    await emailTriggerService.processEmail({
      from,
      subject,
      body: emailBody,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Test email processed successfully. Check if any automation rules were triggered.'
    });
  } catch (error) {
    console.error('Error processing test email:', error);
    return NextResponse.json(
      { error: 'Failed to process test email' },
      { status: 500 }
    );
  }
}
