import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GmailAPIService } from '@/lib/services/gmail-api';

/**
 * GET /api/email/oauth/gmail/authorize
 * Get Gmail OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request URL to determine the correct base URL
    const requestUrl = request.url;
    const authUrl = GmailAPIService.getAuthUrl(session.user.id, requestUrl);

    return NextResponse.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

