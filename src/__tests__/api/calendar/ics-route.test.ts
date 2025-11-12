/**
 * Integration tests for Calendar ICS API Route
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/calendar/event/[eventId]/ics/route';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

// Mock dependencies
jest.mock('@/lib/db/mongodb');

// Create a mock CalendarEvent with a mutable findOne
let findOneResult: any = null;

jest.mock('@/lib/models/CalendarEvent', () => ({
  CalendarEvent: {
    findOne: jest.fn((query: any) => {
      const result = findOneResult;
      // Return a thenable object (like Mongoose queries)
      return Promise.resolve(result);
    }),
  },
}));

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockCalendarEvent = CalendarEvent as any;

// Helper to set the findOne result
const setFindOneResult = (result: any) => {
  findOneResult = result;
};

describe('Calendar ICS API Route', () => {
  const mockEventId = 'test-event-id-123';
  
  const mockEvent = {
    _id: mockEventId,
    title: 'Test Calendar Event',
    description: 'This is a test event',
    location: 'Test Location, San Francisco, CA',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    attendees: ['attendee1@example.com', 'attendee2@example.com'],
    status: 'confirmed',
    source: 'manual',
    userId: 'test-user-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    setFindOneResult(null);
  });

  describe('Successful ICS Generation', () => {
    it('should generate valid ICS file for event', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);

      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(mockConnectDB).toHaveBeenCalled();
      expect(MockCalendarEvent.findOne).toHaveBeenCalledWith({ _id: mockEventId });
      expect(response.status).toBe(200);
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      expect(icsContent).toContain('END:VCALENDAR');
    });

    it('should include event title in ICS file', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain(`SUMMARY:${mockEvent.title}`);
    });

    it('should include event dates in ICS file', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      // ICS format: YYYYMMDDTHHMMSSZ (no dashes or colons)
      expect(icsContent).toContain('DTSTART:20240115T100000Z');
      expect(icsContent).toContain('DTEND:20240115T110000Z');
    });

    it('should include location in ICS file when present', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain('LOCATION:');
      expect(icsContent).toContain('Test Location');
    });

    it('should include description in ICS file when present', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain('DESCRIPTION:');
      expect(icsContent).toContain('This is a test event');
    });

    it('should include attendees in ICS file when present', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain('ATTENDEE');
      expect(icsContent).toContain('attendee1@example.com');
      expect(icsContent).toContain('attendee2@example.com');
    });

    it('should set correct Content-Type header', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });

      const contentType = response.headers.get('Content-Type');
      expect(contentType).toBe('text/calendar; charset=utf-8');
    });

    it('should set correct Content-Disposition header', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain(`filename="event-${mockEventId}.ics"`);
    });
  });

  describe('Event Not Found', () => {
    it('should return 404 when event does not exist', async () => {
      setFindOneResult(null);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Event not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockConnectDB.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to generate calendar file');
    });

    it('should handle event query errors', async () => {
      MockCalendarEvent.findOne = jest.fn().mockRejectedValue(new Error('Query failed'));

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('ICS Format Validation', () => {
    it('should escape special characters in event title', async () => {
      const eventWithSpecialChars = {
        ...mockEvent,
        title: 'Event, with; special\\ characters',
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithSpecialChars);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      // Special characters should be escaped
      expect(icsContent).toContain('Event\\, with\\; special\\\\ characters');
    });

    it('should escape special characters in location', async () => {
      const eventWithSpecialChars = {
        ...mockEvent,
        location: 'Location, with; special\\ characters',
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithSpecialChars);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain('LOCATION:');
      // Should escape commas, semicolons, and backslashes
      expect(icsContent).toMatch(/Location\\, with\\; special\\\\ characters/);
    });

    it('should handle newlines in description', async () => {
      const eventWithNewlines = {
        ...mockEvent,
        description: 'Line 1\nLine 2\nLine 3',
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithNewlines);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      // Newlines should be escaped as \n
      expect(icsContent).toContain('Line 1\\nLine 2\\nLine 3');
    });

    it('should use CRLF line breaks (\\r\\n) for iCalendar format', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      // iCalendar format requires \r\n line breaks
      expect(icsContent).toContain('\r\n');
    });

    it('should include UID in ICS file', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(icsContent).toContain(`UID:${mockEventId}`);
    });

    it('should include DTSTAMP in ICS file', async () => {
      setFindOneResult(mockEvent);

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      // DTSTAMP should be in iCalendar format (YYYYMMDDTHHMMSSZ)
      expect(icsContent).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });
  });

  describe('Optional Fields', () => {
    it('should handle event without location', async () => {
      const eventWithoutLocation = {
        ...mockEvent,
        location: undefined,
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithoutLocation);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(response.status).toBe(200);
      expect(icsContent).not.toContain('LOCATION:');
    });

    it('should handle event without description', async () => {
      const eventWithoutDescription = {
        ...mockEvent,
        description: undefined,
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithoutDescription);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(response.status).toBe(200);
      expect(icsContent).not.toContain('DESCRIPTION:');
    });

    it('should handle event without attendees', async () => {
      const eventWithoutAttendees = {
        ...mockEvent,
        attendees: undefined,
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithoutAttendees);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(response.status).toBe(200);
      expect(icsContent).not.toContain('ATTENDEE');
    });

    it('should handle empty attendees array', async () => {
      const eventWithEmptyAttendees = {
        ...mockEvent,
        attendees: [],
      };

      const mockFindOne = jest.fn().mockResolvedValue(eventWithEmptyAttendees);
      MockCalendarEvent.findOne = mockFindOne;

      const request = new NextRequest(`http://localhost:3000/api/calendar/event/${mockEventId}/ics`);
      const response = await GET(request, { params: { eventId: mockEventId } });
      const icsContent = await response.text();

      expect(response.status).toBe(200);
      expect(icsContent).not.toContain('ATTENDEE');
    });
  });
});

