'use client';

import { useState } from 'react';

interface AppleCalendarButtonProps {
  eventId: string;
  appleEventUrl?: string;
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    attendees?: string[];
  };
}

export default function AppleCalendarButton({ eventId, appleEventUrl, event }: AppleCalendarButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate .ics file content
      const icsContent = generateICSContent(event);
      
      // Use data URI to open in Apple Calendar
      // On macOS/iOS, this will open Calendar.app with the event
      const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
      
      // Create a temporary link and click it
      // This will open Calendar.app on macOS/iOS
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `event-${eventId}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Also try to open the CalDAV URL if available (for synced events)
      if (appleEventUrl) {
        // Try opening the CalDAV URL in a new tab as fallback
        setTimeout(() => {
          window.open(appleEventUrl, '_blank');
        }, 500);
      }
    } catch (error) {
      console.error('Error opening Apple Calendar:', error);
      // Fallback to downloading .ics file via API
      window.location.href = `/api/calendar/event/${eventId}/ics`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {loading ? 'Opening...' : appleEventUrl ? 'View in Apple Calendar' : 'Add to Apple Calendar'}
    </button>
  );
}

function generateICSContent(event: AppleCalendarButtonProps['event']): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `event-${Date.now()}`;
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

