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
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 /api/email/scan endpoint called');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    const session = await auth();
    console.log('📧 Session check:', session?.user?.id ? `User ID: ${session.user.id}` : 'No session');
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;
    console.log('📧 Request body:', { accountId });

    if (!accountId) {
      console.log('❌ Missing accountId');
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the email account (make sure to include credentials)
    const account = await EmailAccount.findOne({
      _id: accountId,
      userId: session.user.id
    }).select('+credentials.accessToken +credentials.refreshToken'); // Explicitly include credentials

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

    // Log credentials status for debugging
    console.log(`📧 Account found: ${account.emailAddress}`);
    console.log(`📧 Provider: ${account.provider}`);
    console.log(`📧 Credentials present: ${!!account.credentials}`);
    console.log(`📧 Access token present: ${!!account.credentials?.accessToken}`);
    console.log(`📧 Refresh token present: ${!!account.credentials?.refreshToken}`);
    console.log(`📧 Client ID present: ${!!account.credentials?.clientId}`);
    console.log(`📧 Client secret present: ${!!account.credentials?.clientSecret}`);

    if (!account.credentials || !account.credentials.accessToken || !account.credentials.refreshToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email account credentials are missing or incomplete. Please reconnect your Gmail account.',
          message: 'The account needs to be re-authenticated. Please disconnect and reconnect Gmail.'
        },
        { status: 400 }
      );
    }

    // Convert to EmailAccount format for polling service
    const pollingAccount = {
      userId: account.userId.toString(),
      emailAddress: account.emailAddress,
      provider: account.provider,
      credentials: {
        accessToken: account.credentials.accessToken,
        refreshToken: account.credentials.refreshToken,
        clientId: account.credentials.clientId || process.env.GOOGLE_CLIENT_ID,
        clientSecret: account.credentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET
      },
      enabled: account.enabled,
      lastChecked: account.lastChecked,
      lastMessageId: account.lastMessageId,
      scanInterval: account.scanInterval
    };

    // Trigger manual scan
    console.log('📧 Triggering manual scan for account:', pollingAccount.emailAddress);
    const result = await emailPollingService.scanAccount(pollingAccount);
    console.log('📧 Scan result:', result);

    // Update last checked time in database
    if (result.success) {
      account.lastChecked = new Date();
      await account.save();
      console.log('📧 Updated lastChecked time in database');
    }

    console.log('📧 Returning scan result to client');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error triggering email scan:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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

