import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

/**
 * Auto-add Calendar Event to Apple Calendar
 * This endpoint automatically downloads the ICS file for an event
 * Can be called programmatically after event creation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const event = await CalendarEvent.findOne({ 
      _id: params.eventId,
      userId: session.user.id 
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Return the ICS file directly
    const icsContent = generateICSFile(event);
    const filename = `event-${params.eventId}.ics`;

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Transfer-Encoding': 'binary',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error auto-adding calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}

function generateICSFile(event: any): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = event._id.toString() || `event-${Date.now()}`;
  const now = formatDate(new Date());
  const startDate = formatDate(new Date(event.startDate));
  const endDate = formatDate(new Date(event.endDate));

  const attendees = event.attendees?.map((email: string) => 
    `ATTENDEE;CN=${email}:mailto:${email}`
  ).join('\r\n') || '';

  const escapeICS = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const location = event.location ? `LOCATION:${escapeICS(event.location)}\r\n` : '';
  const description = event.description 
    ? `DESCRIPTION:${escapeICS(event.description)}\r\n` 
    : '';
  const summary = escapeICS(event.title);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Concierge AI//Calendar Integration//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${summary}`,
    description,
    location,
    attendees ? `${attendees}\r\n` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '');

  return lines.join('\r\n');
}

