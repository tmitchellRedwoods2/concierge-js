'use client';

import { useState } from 'react';

// Helper to detect macOS
const isMacOS = () => {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
};

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
    e.stopPropagation();
    setLoading(true);

    try {
      // Use absolute URL to avoid Next.js routing issues
      const baseUrl = window.location.origin;
      const icsUrl = `${baseUrl}/api/calendar/event/${eventId}/ics`;
      
      console.log('Attempting to download ICS file from:', icsUrl);
      
      // Fetch the file as a blob
      const response = await fetch(icsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/calendar, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      // Verify Content-Type
      const contentType = response.headers.get('Content-Type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('text/calendar')) {
        console.warn('Unexpected Content-Type:', contentType);
      }

      // Get the blob
      const blob = await response.blob();
      console.log('Blob received, size:', blob.size, 'type:', blob.type);
      
      // Create a blob URL with the correct MIME type
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `event-${eventId}.ics`;
      link.style.display = 'none';
      
      // Append to body and click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        setLoading(false);
      }, 200);
      
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      setLoading(false);
      
      // Show user-friendly error
      alert('Failed to download calendar file. Please try right-clicking the button and selecting "Save Link As" or contact support.');
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


