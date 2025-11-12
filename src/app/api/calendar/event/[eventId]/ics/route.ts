import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await connectDB();

    const event = await CalendarEvent.findOne({ _id: params.eventId });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Generate .ics file content
    const icsContent = generateICSFile(event);

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${params.eventId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ICS file:', error);
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

  const location = event.location ? `LOCATION:${event.location.replace(/,/g, '\\,')}` : '';
  const description = event.description 
    ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}` 
    : '';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Concierge AI//Calendar Integration//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title.replace(/,/g, '\\,')}
${description}
${location}
${attendees}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

