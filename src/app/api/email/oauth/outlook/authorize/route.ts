import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { OutlookAPIService } from '@/lib/services/outlook-api';

/**
 * GET /api/email/oauth/outlook/authorize
 * Get Outlook OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = OutlookAPIService.getAuthUrl(session.user.id);

    return NextResponse.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

