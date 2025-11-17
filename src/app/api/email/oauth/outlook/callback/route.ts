import { NextRequest, NextResponse } from 'next/server';
import { OutlookAPIService } from '@/lib/services/outlook-api';
import EmailAccount from '@/lib/db/models/EmailAccount';
import connectDB from '@/lib/db/mongodb';
import { emailPollingService } from '@/lib/services/email-polling';

/**
 * Outlook OAuth Callback
 * Handles the OAuth callback from Microsoft after user authorizes access
 */
export async function GET(request: NextRequest) {
  // Determine the base URL (used in both try and catch blocks)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  'http://localhost:3000';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${cleanBaseUrl}/settings/email-scanning?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${cleanBaseUrl}/settings/email-scanning?error=missing_parameters`
      );
    }

    // Exchange code for tokens
    const credentials = await OutlookAPIService.getTokensFromCode(code);

    await connectDB();

    // Find or create email account
    const emailAddress = credentials.emailAddress || ''; // We'll need to fetch this from Graph API
    let account = await EmailAccount.findOne({
      userId: state,
      provider: 'outlook'
    });

    if (account) {
      // Update existing account
      account.credentials = {
        ...account.credentials,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret
      };
      await account.save();
    } else {
      // Create new account
      account = new EmailAccount({
        userId: state,
        emailAddress: emailAddress || 'pending@outlook.com',
        provider: 'outlook',
        credentials: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          tenantId: credentials.tenantId,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret
        },
        enabled: true,
        scanInterval: 15
      });
      await account.save();
    }

    // Start polling if enabled
    if (account.enabled) {
      await emailPollingService.startPolling({
        userId: account.userId,
        emailAddress: account.emailAddress,
        provider: account.provider,
        credentials: account.credentials,
        enabled: account.enabled,
        scanInterval: account.scanInterval
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${cleanBaseUrl}/settings/email-scanning?success=outlook_connected`
    );

  } catch (error) {
    console.error('Error in Outlook OAuth callback:', error);
    return NextResponse.redirect(
      `${cleanBaseUrl}/settings/email-scanning?error=oauth_failed`
    );
  }
}

