import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { smartScheduler } from '@/lib/services/smart-scheduler';

// POST /api/automation/smart-schedule - Auto-schedule an event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, duration, type, description, location } = body;

    // Validate required fields
    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: title, duration' },
        { status: 400 }
      );
    }

    // Auto-schedule the event
    const event = await smartScheduler.autoScheduleEvent(session.user.id, {
      title,
      duration: parseInt(duration),
      type,
      description,
      location
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Unable to find optimal time for scheduling' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        description: event.description
      },
      message: 'Event auto-scheduled successfully'
    });
  } catch (error) {
    console.error('Error auto-scheduling event:', error);
    return NextResponse.json(
      { error: 'Failed to auto-schedule event' },
      { status: 500 }
    );
  }
}
