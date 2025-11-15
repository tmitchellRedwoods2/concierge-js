import { NextRequest, NextResponse } from 'next/server';
import { GmailAPIService } from '@/lib/services/gmail-api';
import EmailAccount from '@/lib/db/models/EmailAccount';
import connectDB from '@/lib/db/mongodb';
import { emailPollingService } from '@/lib/services/email-polling';

/**
 * Gmail OAuth Callback
 * Handles the OAuth callback from Google after user authorizes access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    // Determine the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

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
    const credentials = await GmailAPIService.getTokensFromCode(code);

    await connectDB();

    // Find or create email account
    const emailAddress = credentials.emailAddress || ''; // We'll need to fetch this from Gmail API
    let account = await EmailAccount.findOne({
      userId: state,
      provider: 'gmail'
    });

    if (account) {
      // Update existing account
      account.credentials = {
        ...account.credentials,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret
      };
      await account.save();
    } else {
      // Create new account (we'll need email address from Gmail API)
      // For now, create with placeholder
      account = new EmailAccount({
        userId: state,
        emailAddress: emailAddress || 'pending@gmail.com',
        provider: 'gmail',
        credentials: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
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

    // Determine the base URL - same logic as in gmail-api.ts
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    'http://localhost:3000';
    const redirectUrl = `${baseUrl.replace(/\/$/, '')}/settings/email-scanning?success=gmail_connected`;
    
    console.log('🔗 Redirecting to:', redirectUrl);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    return NextResponse.redirect(
      `${cleanBaseUrl}/settings/email-scanning?error=oauth_failed`
    );
  }
}

