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

    // Set headers to trigger Calendar.app on macOS
    // macOS will automatically open .ics files in Calendar.app when downloaded
    // Use RFC 5987 encoding for filename to ensure .ics extension is preserved
    const filename = `event-${params.eventId}.ics`;
    const encodedFilename = encodeURIComponent(filename);
    
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Transfer-Encoding': 'binary',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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

  // Build attendees list with proper line breaks
  const attendees = event.attendees?.map((email: string) => 
    `ATTENDEE;CN=${email}:mailto:${email}`
  ).join('\r\n') || '';

  // Escape special characters for iCalendar format
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

  // Build the .ics file with proper line breaks (\r\n is required for iCalendar format)
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
  ].filter(line => line !== ''); // Remove empty lines

  return lines.join('\r\n');
}

