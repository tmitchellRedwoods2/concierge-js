/**
 * API routes for event monitoring management
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { EventMonitor } from '@/lib/workflows/event-monitor';

// Global event monitor instance
let eventMonitor: EventMonitor | null = null;

function getEventMonitor(): EventMonitor {
  if (!eventMonitor) {
    eventMonitor = new EventMonitor();
  }
  return eventMonitor;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const monitor = getEventMonitor();
    const userMonitors = monitor.getUserMonitors(session.user.id);

    return NextResponse.json({
      success: true,
      monitors: userMonitors
    });

  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, config } = body;

    await connectDB();

    const monitor = getEventMonitor();
    let monitorId: string;

    switch (type) {
      case 'email':
        monitorId = await monitor.startEmailMonitoring(session.user.id, config);
        break;
      case 'voicemail':
        monitorId = await monitor.startVoicemailMonitoring(session.user.id, config);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid monitor type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      monitorId,
      message: `${type} monitoring started successfully`
    });

  } catch (error) {
    console.error('Error starting monitor:', error);
    return NextResponse.json(
      { error: 'Failed to start monitor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monitorId = searchParams.get('monitorId');

    if (!monitorId) {
      return NextResponse.json(
        { error: 'Monitor ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const monitor = getEventMonitor();
    monitor.stopMonitoring(monitorId);

    return NextResponse.json({
      success: true,
      message: 'Monitor stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping monitor:', error);
    return NextResponse.json(
      { error: 'Failed to stop monitor' },
      { status: 500 }
    );
  }
}
