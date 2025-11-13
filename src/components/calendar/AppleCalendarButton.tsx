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
  const [showFallback, setShowFallback] = useState(false);

  const icsUrl = `/api/calendar/event/${eventId}/ics`;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      // Use absolute URL to avoid Next.js routing issues
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${icsUrl}`;
      
      console.log('Attempting to download ICS file from:', fullUrl);
      
      // Fetch the file as a blob
      const response = await fetch(fullUrl, {
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

      // Use a hidden iframe to download without navigating away
      // This preserves the Content-Disposition filename
      console.log('Downloading via hidden iframe');
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fullUrl;
      document.body.appendChild(iframe);
      
      // Clean up iframe after download starts
      setTimeout(() => {
        document.body.removeChild(iframe);
        setLoading(false);
      }, 2000);
      
      // Also try direct link as backup
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `event-${eventId}.ics`;
      link.target = '_blank';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      setLoading(false);
      setShowFallback(true);
    }
  };

  // If fallback is shown, provide a direct link
  if (showFallback) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={icsUrl}
          download={`event-${eventId}.ics`}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2 text-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowFallback(false);
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Download .ics File
        </a>
        <p className="text-xs text-gray-500">Right-click and "Save Link As" if download doesn't start</p>
      </div>
    );
  }

  // Debug: Log on component render
  console.log('AppleCalendarButton rendered for eventId:', eventId, 'icsUrl:', icsUrl);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            console.log('Button clicked!', e);
            handleClick(e);
          }}
          onMouseDown={(e) => {
            console.log('Button mouse down!', e);
          }}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {loading ? 'Opening...' : appleEventUrl ? 'View in Apple Calendar' : 'Add to Apple Calendar'}
        </button>
        {/* Also provide a direct link as backup */}
        <a
          href={icsUrl}
          download={`event-${eventId}.ics`}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => {
            console.log('Direct link clicked!', e);
            e.stopPropagation();
          }}
        >
          (Direct Download)
        </a>
      </div>
      <p className="text-xs text-gray-500">
        💡 <strong>Tip:</strong> If the downloaded file doesn't have a .ics extension, rename it to add ".ics" at the end, then double-click to open in Calendar.app
      </p>
    </div>
  );
}


