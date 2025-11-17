import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import EmailAccount from '@/lib/db/models/EmailAccount';
import connectDB from '@/lib/db/mongodb';
import { emailPollingService } from '@/lib/services/email-polling';

/**
 * POST /api/email/scan
 * Manually trigger an email scan for a specific account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the email account
    const account = await EmailAccount.findOne({
      _id: accountId,
      userId: session.user.id
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (!account.enabled) {
      return NextResponse.json(
        { error: 'Email account is disabled. Please enable it first.' },
        { status: 400 }
      );
    }

    // Convert to EmailAccount format for polling service
    const pollingAccount = {
      userId: account.userId.toString(),
      emailAddress: account.emailAddress,
      provider: account.provider,
      credentials: account.credentials,
      enabled: account.enabled,
      lastChecked: account.lastChecked,
      lastMessageId: account.lastMessageId,
      scanInterval: account.scanInterval
    };

    // Trigger manual scan
    const result = await emailPollingService.scanAccount(pollingAccount);

    // Update last checked time in database
    if (result.success) {
      account.lastChecked = new Date();
      await account.save();
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error triggering email scan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger email scan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

