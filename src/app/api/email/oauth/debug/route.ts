import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET /api/email/oauth/debug
 * Debug endpoint to show the exact redirect URIs being used
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get base URL from the request itself (same logic as in the OAuth flows)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    const gmailRedirectUri = `${cleanBaseUrl}/api/email/oauth/gmail/callback`;
    const outlookRedirectUri = `${cleanBaseUrl}/api/email/oauth/outlook/callback`;

    return NextResponse.json({
      success: true,
      baseUrl: cleanBaseUrl,
      redirectUris: {
        gmail: gmailRedirectUri,
        outlook: outlookRedirectUri
      },
      instructions: {
        step1: 'Copy the Gmail redirect URI above',
        step2: 'Go to Google Cloud Console → APIs & Services → Credentials',
        step3: 'Click on your OAuth 2.0 Client ID',
        step4: 'Under "Authorized redirect URIs", click "+ ADD URI"',
        step5: 'Paste the Gmail redirect URI exactly as shown',
        step6: 'Click "Save"',
        step7: 'Try the Gmail OAuth flow again'
      },
      environment: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
        VERCEL_URL: process.env.VERCEL_URL || '(not set)',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in OAuth debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get debug information' },
      { status: 500 }
    );
  }
}

