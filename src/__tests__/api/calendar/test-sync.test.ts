/**
 * Unit tests for Calendar Test Sync API Route
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/calendar/test-sync/route';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { emailParserService } from '@/lib/services/email-parser';
import { NotificationService } from '@/lib/services/notification-service';
import { CalendarSyncService } from '@/lib/services/calendar-sync';

// Mock dependencies
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/services/email-parser');
jest.mock('@/lib/services/notification-service');
jest.mock('@/lib/services/calendar-sync');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockEmailParserService = emailParserService as jest.Mocked<typeof emailParserService>;
const MockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;
const MockCalendarSyncService = CalendarSyncService as jest.MockedClass<typeof CalendarSyncService>;

const mockSyncEventIfEnabled = jest.fn().mockResolvedValue({ 
  success: true, 
  externalEventId: 'google-event-123',
  externalCalendarUrl: 'https://calendar.google.com/event?eid=google-event-123',
  calendarType: 'google'
});

// Mock CalendarEvent
let findOneResult: any = null;
let savedEvent: any = null;

jest.mock('@/lib/models/CalendarEvent', () => {
  const MockCalendarEvent = jest.fn().mockImplementation(function(data) {
    savedEvent = { ...data, _id: 'new-event-id', save: jest.fn().mockResolvedValue(this) };
    return savedEvent;
  });
  
  MockCalendarEvent.findOne = jest.fn((query) => Promise.resolve(findOneResult));
  
  return { CalendarEvent: MockCalendarEvent };
});

const MockCalendarEvent = CalendarEvent as any;

const setFindOneResult = (result: any) => {
  findOneResult = result;
};

describe('Calendar Test Sync API Route', () => {
  const mockUserId = 'test-user-id';
  const mockParsedAppointment = {
    title: 'Test Appointment with Dr. Smith',
    startDate: new Date('2024-01-15T14:00:00Z'),
    endDate: new Date('2024-01-15T15:00:00Z'),
    location: '123 Test Medical Center',
    description: 'Test appointment description',
    doctorName: 'Dr. Smith',
    doctorEmail: 'dr.smith@example.com',
    attendees: ['dr.smith@example.com'],
    allDay: false,
    confidence: 0.9
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    setFindOneResult(null);
    savedEvent = null;
    
    // Mock NotificationService
    MockNotificationService.mockImplementation(() => ({
      sendAppointmentConfirmation: jest.fn().mockResolvedValue({ success: true })
    } as any));
    
    // Mock CalendarSyncService
    MockCalendarSyncService.mockImplementation(() => ({
      syncEventIfEnabled: mockSyncEventIfEnabled
    } as any));
    mockSyncEventIfEnabled.mockResolvedValue({ 
      success: true, 
      externalEventId: 'google-event-123',
      externalCalendarUrl: 'https://calendar.google.com/event?eid=google-event-123',
      calendarType: 'google'
    });
    
    // Mock email parser
    (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null session
      jest.spyOn(require('@/lib/auth'), 'auth').mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test@example.com',
            subject: 'Test',
            body: 'Test body'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Event Creation', () => {
    beforeEach(() => {
      // Mock authenticated session
      jest.spyOn(require('@/lib/auth'), 'auth').mockResolvedValue({
        user: {
          id: mockUserId,
          email: 'user@example.com',
          name: 'Test User'
        }
      });
    });

    it('should create calendar event from parsed appointment', async () => {
      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentCreated).toBe(true);
      expect(data.eventId).toBeDefined();
      expect(MockCalendarEvent).toHaveBeenCalled();
      expect(savedEvent.save).toHaveBeenCalled();
      expect(savedEvent.source).toBe('email');
    });

    it('should return error if email does not contain appointment information', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test@example.com',
            subject: 'Random Email',
            body: 'This is not an appointment email'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toContain('does not appear to contain appointment information');
    });

    it('should not create duplicate events', async () => {
      setFindOneResult({
        _id: 'existing-event-id',
        title: mockParsedAppointment.title,
        startDate: mockParsedAppointment.startDate,
        endDate: mockParsedAppointment.endDate
      });

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDuplicate).toBe(true);
      expect(data.eventId).toBe('existing-event-id');
      expect(MockCalendarEvent).not.toHaveBeenCalled();
    });
  });

  describe('Calendar Sync', () => {
    beforeEach(() => {
      jest.spyOn(require('@/lib/auth'), 'auth').mockResolvedValue({
        user: {
          id: mockUserId,
          email: 'user@example.com',
          name: 'Test User'
        }
      });
    });

    it('should automatically sync event to external calendar when sync is enabled', async () => {
      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSyncEventIfEnabled).toHaveBeenCalled();
      expect(data.syncResult).toBeDefined();
      expect(data.syncResult.synced).toBe(true);
    });

    it('should update event with external calendar info when sync succeeds', async () => {
      mockSyncEventIfEnabled.mockResolvedValueOnce({
        success: true,
        externalEventId: 'google-event-123',
        externalCalendarUrl: 'https://calendar.google.com/event?eid=google-event-123',
        calendarType: 'google'
      });

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(savedEvent.save).toHaveBeenCalledTimes(2); // Once for creation, once for sync update
      expect(savedEvent.googleEventId).toBe('google-event-123');
      expect(savedEvent.googleEventUrl).toBe('https://calendar.google.com/event?eid=google-event-123');
    });

    it('should continue event creation even if calendar sync fails', async () => {
      mockSyncEventIfEnabled.mockResolvedValueOnce({
        success: false,
        error: 'Calendar sync not enabled'
      });

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentCreated).toBe(true);
      expect(savedEvent.save).toHaveBeenCalled();
    });
  });

  describe('Notification', () => {
    beforeEach(() => {
      jest.spyOn(require('@/lib/auth'), 'auth').mockResolvedValue({
        user: {
          id: mockUserId,
          email: 'user@example.com',
          name: 'Test User'
        }
      });
    });

    it('should send notification when event is created', async () => {
      const mockSendAppointmentConfirmation = jest.fn().mockResolvedValue({ success: true });
      MockNotificationService.mockImplementation(() => ({
        sendAppointmentConfirmation: mockSendAppointmentConfirmation
      } as any));

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendAppointmentConfirmation).toHaveBeenCalled();
    });

    it('should continue even if notification fails', async () => {
      const mockSendAppointmentConfirmation = jest.fn().mockRejectedValue(new Error('Notification failed'));
      MockNotificationService.mockImplementation(() => ({
        sendAppointmentConfirmation: mockSendAppointmentConfirmation
      } as any));

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentCreated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(require('@/lib/auth'), 'auth').mockResolvedValue({
        user: {
          id: mockUserId,
          email: 'user@example.com',
          name: 'Test User'
        }
      });
    });

    it('should handle database connection errors', async () => {
      mockConnectDB.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle event save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      MockCalendarEvent.mockImplementationOnce(() => ({
        save: mockSave,
        _id: 'test-id'
      }));

      const request = new NextRequest('http://localhost:3000/api/calendar/test-sync', {
        method: 'POST',
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment',
            body: 'Your appointment is scheduled for January 15, 2024 at 2:00 PM'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

