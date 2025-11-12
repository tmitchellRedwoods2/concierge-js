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

      // Get the .ics file as a blob with the correct MIME type
      const blob = await response.blob();
      
      // Create a blob URL - this is more reliable than data URIs
      // and works better with macOS Calendar.app
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `event-${eventId}.ics`;
      link.style.display = 'none';
      
      // Append to body, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      // This gives the browser time to process the download
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      // Fallback: try direct navigation to the API endpoint
      // The server will send proper headers for download
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


