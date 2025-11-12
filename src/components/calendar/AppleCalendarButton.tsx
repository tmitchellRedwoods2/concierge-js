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
  // Use a direct link to the .ics endpoint
  // On macOS, this will automatically open Calendar.app when clicked
  const icsUrl = `/api/calendar/event/${eventId}/ics`;

  return (
    <a
      href={icsUrl}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
      download={`event-${eventId}.ics`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {appleEventUrl ? 'View in Apple Calendar' : 'Add to Apple Calendar'}
    </a>
  );
}


