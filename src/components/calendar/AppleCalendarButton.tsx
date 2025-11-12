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
      const icsUrl = `/api/calendar/event/${eventId}/ics`;
      
      // First, verify the API endpoint works
      const response = await fetch(icsUrl, {
        method: 'HEAD', // Just check if it exists
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      // Verify Content-Type
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/calendar')) {
        console.warn('Unexpected Content-Type:', contentType);
      }

      // Strategy: For macOS, try to trigger download which should auto-open Calendar.app
      // For other platforms, use standard download
      if (isMacOS()) {
        // On macOS, create a download link - macOS should auto-open .ics files in Calendar.app
        const link = document.createElement('a');
        link.href = icsUrl;
        link.download = `event-${eventId}.ics`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      } else {
        // For non-macOS, use window.open as fallback
        window.open(icsUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Error opening calendar file:', error);
      // Last resort: try direct navigation
      window.location.href = `/api/calendar/event/${eventId}/ics`;
    } finally {
      // Reset loading state
      setTimeout(() => {
        setLoading(false);
      }, 1000);
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


