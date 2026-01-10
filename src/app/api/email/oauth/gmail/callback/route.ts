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
  // Get base URL from the request itself
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
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

    // Exchange code for tokens (pass request URL to ensure redirect URI matches)
    const credentials = await GmailAPIService.getTokensFromCode(code, request.url);

    await connectDB();

    // Find or create email account
    const emailAddress = credentials.emailAddress || 'pending@gmail.com';
    let account = await EmailAccount.findOne({
      userId: state,
      emailAddress: emailAddress, // Match by email address if available
      provider: 'gmail'
    });
    
    // If not found by email, try finding by userId and provider
    if (!account) {
      account = await EmailAccount.findOne({
        userId: state,
        provider: 'gmail'
      });
    }

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

    // Redirect to success page
    const redirectUrl = `${cleanBaseUrl}/settings/email-scanning?success=gmail_connected`;
    
    console.log('🔗 Redirecting to:', redirectUrl);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error in Gmail OAuth callback:', error);
    
    // Provide more specific error messages
    let errorMessage = 'oauth_failed';
    if (error?.message?.includes('redirect_uri_mismatch')) {
      errorMessage = `redirect_uri_mismatch: The redirect URI ${cleanBaseUrl}/api/email/oauth/gmail/callback must be added to Google Cloud Console`;
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ REDIRECT URI MISMATCH ERROR');
      console.error('   Expected redirect URI:', `${cleanBaseUrl}/api/email/oauth/gmail/callback`);
      console.error('   Please add this exact URI to Google Cloud Console');
      console.error('   See GMAIL_OAUTH_SETUP.md for instructions');
      console.error('═══════════════════════════════════════════════════════');
    }
    
    return NextResponse.redirect(
      `${cleanBaseUrl}/settings/email-scanning?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

