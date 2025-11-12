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
      // Fetch the .ics file content
      const response = await fetch(`/api/calendar/event/${eventId}/ics`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-${eventId}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      // On macOS, the downloaded .ics file should automatically open in Calendar.app
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      // Fallback: try direct navigation
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


