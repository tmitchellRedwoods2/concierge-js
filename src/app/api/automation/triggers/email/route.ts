import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailTriggerService } from '@/lib/services/email-trigger';

// POST /api/automation/triggers/email - Process incoming email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { from, subject, body: emailBody, patterns, ruleId } = body;

    // If patterns and ruleId provided, create a new trigger
    if (patterns && ruleId) {
      const triggerId = emailTriggerService.addTrigger({
        userId: session.user.id,
        patterns,
        ruleId,
        enabled: true
      });

      return NextResponse.json({
        success: true,
        triggerId,
        message: 'Email trigger created successfully'
      });
    }

    // Otherwise, process the email
    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      );
    }

    await emailTriggerService.processEmail({
      from,
      subject,
      body: emailBody,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully'
    });
  } catch (error) {
    console.error('Error processing email trigger:', error);
    return NextResponse.json(
      { error: 'Failed to process email trigger' },
      { status: 500 }
    );
  }
}

// GET /api/automation/triggers/email - Get email triggers for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const triggers = emailTriggerService.getUserTriggers(session.user.id);

    return NextResponse.json({
      success: true,
      triggers,
      count: triggers.length
    });
  } catch (error) {
    console.error('Error fetching email triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email triggers' },
      { status: 500 }
    );
  }
}
