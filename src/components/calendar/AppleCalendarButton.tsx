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

      // Get the file content as text to ensure proper handling
      const icsText = await response.text();
      console.log('ICS content received, length:', icsText.length);
      
      // Create a blob with explicit .ics MIME type
      const icsBlob = new Blob([icsText], { 
        type: 'text/calendar; charset=utf-8' 
      });
      
      // Create blob URL
      const blobUrl = window.URL.createObjectURL(icsBlob);
      
      // Create download link with .ics extension explicitly in filename
      const filename = `event-${eventId}.ics`;
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename); // Ensure download attribute is set
      link.style.display = 'none';
      
      // Append to body
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      console.log('Download triggered for:', filename);
      
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        setLoading(false);
      }, 1000);
      
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
    <>
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
        className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
        onClick={(e) => {
          console.log('Direct link clicked!', e);
          e.stopPropagation();
        }}
      >
        (Direct Download)
      </a>
    </>
  );
}


