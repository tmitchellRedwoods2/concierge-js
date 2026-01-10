import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailPollingWorker } from '@/lib/services/email-polling-worker';

/**
 * POST /api/email/polling/init
 * Initialize email polling for all enabled accounts
 * This endpoint can be called on app startup or manually
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize the worker
    await emailPollingWorker.initialize();

    return NextResponse.json({
      success: true,
      message: 'Email polling worker initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing email polling:', error);
    return NextResponse.json(
      { error: 'Failed to initialize email polling' },
      { status: 500 }
    );
  }
}

