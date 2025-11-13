/**
 * Integration tests for Email Webhook API Route
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/email/webhook/route';
import connectDB from '@/lib/db/mongodb';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { emailParserService } from '@/lib/services/email-parser';
import { emailTriggerService } from '@/lib/services/email-trigger';
import { NotificationService } from '@/lib/services/notification-service';
import { CalendarSyncService } from '@/lib/services/calendar-sync';

// Mock dependencies
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/services/email-parser');
jest.mock('@/lib/services/email-trigger');
jest.mock('@/lib/services/notification-service');
jest.mock('@/lib/services/calendar-sync');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockEmailParserService = emailParserService as jest.Mocked<typeof emailParserService>;
const mockEmailTriggerService = emailTriggerService as jest.Mocked<typeof emailTriggerService>;
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

describe('Email Webhook API Route', () => {
  const mockUserId = 'test-user-id';
  const mockParsedAppointment = {
    title: 'Appointment with Dr. Smith',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    location: '123 Medical Center',
    description: 'Regular checkup',
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
    
    // Mock email trigger service
    (mockEmailTriggerService.processEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe('Webhook Security', () => {
    it('should reject requests without webhook secret when secret is configured', async () => {
      process.env.EMAIL_WEBHOOK_SECRET = 'test-secret';
      
      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      
      delete process.env.EMAIL_WEBHOOK_SECRET;
    });

    it('should accept requests with correct webhook secret', async () => {
      process.env.EMAIL_WEBHOOK_SECRET = 'test-secret';
      
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'test-secret'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      delete process.env.EMAIL_WEBHOOK_SECRET;
    });
  });

  describe('Email Format Support', () => {
    it('should handle SendGrid email format', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        text: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockEmailParserService.parseAppointmentEmail).toHaveBeenCalledWith({
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled'
      });
    });

    it('should handle Mailgun email format', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        sender: 'doctor@example.com',
        subject: 'Appointment',
        'body-plain': 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockEmailParserService.parseAppointmentEmail).toHaveBeenCalledWith({
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled'
      });
    });

    it('should handle generic email format', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid email format', async () => {
      const body = {
        invalid: 'format'
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });
  });

  describe('Appointment Creation', () => {
    it('should create calendar event from parsed appointment', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null); // No existing event

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled for January 15, 2024 at 10:00 AM',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentCreated).toBe(true);
      expect(data.eventId).toBeDefined();
      expect(data.icsUrl).toBeDefined();
      expect(MockCalendarEvent).toHaveBeenCalled();
    });

    it('should not create duplicate events', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      
      // Simulate existing event
      setFindOneResult({
        _id: 'existing-event-id',
        title: 'Appointment with Dr. Smith',
        startDate: mockParsedAppointment.startDate
      });

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointmentCreated).toBe(false);
      expect(data.eventId).toBe('existing-event-id');
      expect(MockCalendarEvent).not.toHaveBeenCalled();
    });

    it('should automatically sync event to external calendar when created', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null);
      mockSyncEventIfEnabled.mockResolvedValueOnce({
        success: true,
        externalEventId: 'google-event-123',
        externalCalendarUrl: 'https://calendar.google.com/event?eid=google-event-123',
        calendarType: 'google'
      });

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSyncEventIfEnabled).toHaveBeenCalled();
      expect(mockSyncEventIfEnabled).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockParsedAppointment.title,
          startDate: mockParsedAppointment.startDate.toISOString()
        }),
        mockUserId
      );
    });

    it('should update event with external calendar info when sync succeeds', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null);
      mockSyncEventIfEnabled.mockResolvedValueOnce({
        success: true,
        externalEventId: 'google-event-123',
        externalCalendarUrl: 'https://calendar.google.com/event?eid=google-event-123',
        calendarType: 'google'
      });

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      await POST(request);

      // Verify event.save was called (to update with external calendar info)
      expect(savedEvent?.save).toHaveBeenCalled();
    });

    it('should continue event creation even if calendar sync fails', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null);
      mockSyncEventIfEnabled.mockResolvedValueOnce({
        success: false,
        error: 'Calendar sync not enabled'
      });

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      // Event should still be created even if sync fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentCreated).toBe(true);
      expect(MockCalendarEvent).toHaveBeenCalled();
    });

    it('should send notification when appointment is created', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null);

      const mockNotificationService = {
        sendAppointmentConfirmation: jest.fn().mockResolvedValue({ success: true })
      };
      MockNotificationService.mockImplementation(() => mockNotificationService as any);

      const body = {
        from: 'dr.smith@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled',
        userId: mockUserId,
        to: 'user@example.com'
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockNotificationService.sendAppointmentConfirmation).toHaveBeenCalled();
    });

    it('should process email through trigger service even if no appointment detected', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(null);

      const body = {
        from: 'newsletter@example.com',
        subject: 'Weekly Newsletter',
        body: 'Check out our updates',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointmentCreated).toBe(false);
      expect(mockEmailTriggerService.processEmail).toHaveBeenCalled();
    });
  });

  describe('GET Endpoint', () => {
    it('should return status message', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Email webhook endpoint is active');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockConnectDB.mockRejectedValue(new Error('Database connection failed'));
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);

      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle notification service errors gracefully', async () => {
      (mockEmailParserService.parseAppointmentEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedAppointment);
      setFindOneResult(null);

      const mockNotificationService = {
        sendAppointmentConfirmation: jest.fn().mockRejectedValue(new Error('Notification failed'))
      };
      MockNotificationService.mockImplementation(() => mockNotificationService as any);

      const body = {
        from: 'doctor@example.com',
        subject: 'Appointment',
        body: 'Your appointment is scheduled',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed even if notification fails
      expect(response.status).toBe(200);
      expect(data.appointmentCreated).toBe(true);
    });
  });
});

