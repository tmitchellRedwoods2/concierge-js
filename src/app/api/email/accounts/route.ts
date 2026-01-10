import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import EmailAccount from '@/lib/db/models/EmailAccount';
import { emailPollingService } from '@/lib/services/email-polling';

/**
 * GET /api/email/accounts
 * Get all email accounts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const accounts = await EmailAccount.find({ userId: session.user.id })
      .select('-credentials.accessToken -credentials.refreshToken -credentials.password')
      .lean();

    return NextResponse.json({
      success: true,
      accounts: accounts.map(account => ({
        ...account,
        _id: account._id.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/accounts
 * Create a new email account for scanning
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailAddress, provider, credentials, scanInterval = 15, enabled = true } = body;

    if (!emailAddress || !provider) {
      return NextResponse.json(
        { error: 'Email address and provider are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if account already exists
    const existing = await EmailAccount.findOne({
      userId: session.user.id,
      emailAddress
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email account already exists' },
        { status: 400 }
      );
    }

    // Create new email account
    const account = new EmailAccount({
      userId: session.user.id,
      emailAddress,
      provider,
      credentials: credentials || {},
      scanInterval,
      enabled
    });

    await account.save();

    // Start polling if enabled
    if (enabled) {
      await emailPollingService.startPolling({
        userId: session.user.id,
        emailAddress,
        provider,
        credentials: credentials || {},
        enabled,
        scanInterval
      });
    }

    console.log(`✅ Email account added: ${emailAddress} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      account: {
        _id: account._id.toString(),
        emailAddress: account.emailAddress,
        provider: account.provider,
        enabled: account.enabled,
        scanInterval: account.scanInterval,
        lastChecked: account.lastChecked
      }
    });

  } catch (error) {
    console.error('Error creating email account:', error);
    return NextResponse.json(
      { error: 'Failed to create email account' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/accounts/[id]
 * Update an email account
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, enabled, scanInterval, credentials } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

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

    // Update fields
    if (enabled !== undefined) {
      account.enabled = enabled;
    }
    if (scanInterval !== undefined) {
      account.scanInterval = scanInterval;
    }
    if (credentials) {
      account.credentials = { ...account.credentials, ...credentials };
    }

    await account.save();

    // Restart polling with new settings
    if (account.enabled) {
      await emailPollingService.startPolling({
        userId: account.userId,
        emailAddress: account.emailAddress,
        provider: account.provider,
        credentials: account.credentials,
        enabled: account.enabled,
        scanInterval: account.scanInterval
      });
    } else {
      emailPollingService.stopPolling(account.userId, account.emailAddress);
    }

    return NextResponse.json({
      success: true,
      account: {
        _id: account._id.toString(),
        emailAddress: account.emailAddress,
        provider: account.provider,
        enabled: account.enabled,
        scanInterval: account.scanInterval,
        lastChecked: account.lastChecked
      }
    });

  } catch (error) {
    console.error('Error updating email account:', error);
    return NextResponse.json(
      { error: 'Failed to update email account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/accounts/[id]
 * Delete an email account
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

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

    // Stop polling before deleting
    emailPollingService.stopPolling(account.userId, account.emailAddress);

    await EmailAccount.deleteOne({ _id: accountId });

    console.log(`✅ Email account deleted: ${account.emailAddress}`);

    return NextResponse.json({
      success: true,
      message: 'Email account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting email account:', error);
    return NextResponse.json(
      { error: 'Failed to delete email account' },
      { status: 500 }
    );
  }
}

