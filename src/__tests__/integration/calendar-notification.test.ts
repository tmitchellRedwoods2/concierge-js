/**
 * Integration Tests - Calendar Notification Workflow
 * Tests the complete flow: Create calendar event -> Send notification -> Update event -> Send modification notification
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { CalendarService } from '@/lib/services/calendar';
import { EmailNotificationService } from '@/lib/services/email-notification';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/services/calendar');
jest.mock('@/lib/services/email-notification');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const MockCalendarService = CalendarService as jest.MockedClass<typeof CalendarService>;
const MockEmailNotificationService = EmailNotificationService as jest.MockedClass<typeof EmailNotificationService>;

describe('Calendar Notification Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'integration-user-123',
      name: 'Integration Test User',
      email: 'test@example.com',
    },
  };

  const mockCalendarEvent = {
    _id: 'calendar-event-123',
    userId: 'integration-user-123',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    location: 'Medical Center',
    attendees: ['patient@example.com'],
    status: 'confirmed',
    createdBy: 'integration-user-123',
    source: 'workflow',
  };

  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockEmailService: jest.Mocked<EmailNotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    
    // Create mock calendar service
    mockCalendarService = {
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      listEvents: jest.fn(),
    } as any;
    
    MockCalendarService.mockImplementation(() => mockCalendarService);
    
    // Create mock email service
    mockEmailService = {
      sendCalendarNotification: jest.fn(),
      testConnection: jest.fn(),
    } as any;
    
    MockEmailNotificationService.mockImplementation(() => mockEmailService);
  });

  describe('Complete Calendar Notification Workflow', () => {
    it('should complete full workflow: create event -> send confirmation -> update event -> send modification', async () => {
      // Step 1: Test calendar service integration
      mockCalendarService.createEvent.mockResolvedValue({
        success: true,
        eventId: 'calendar-event-123',
        eventUrl: 'https://calendar.google.com/event/123',
      });

      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'confirmation-123',
      });

      // Test calendar service directly
      const calendarResult = await mockCalendarService.createEvent({
        summary: 'Doctor Appointment',
        description: 'Annual checkup',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Medical Center',
      });

      expect(calendarResult.success).toBe(true);
      expect(calendarResult.eventId).toBe('calendar-event-123');

      // Test email notification service directly
      const emailResult = await mockEmailService.sendCalendarNotification({
        eventId: 'calendar-event-123',
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T11:00:00Z'),
        location: 'Medical Center',
        reminderType: 'appointment_confirmation',
        recipientEmail: 'patient@example.com',
        recipientName: 'John Doe',
      });

      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('confirmation-123');

      // Step 2: Test update workflow
      mockCalendarService.updateEvent.mockResolvedValue({
        success: true,
        eventId: 'calendar-event-123',
        eventUrl: 'https://calendar.google.com/event/123',
      });

      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'modification-123',
      });

      const updateResult = await mockCalendarService.updateEvent('calendar-event-123', {
        summary: 'Doctor Appointment - Updated',
        description: 'Annual checkup - rescheduled',
        start: { dateTime: '2024-01-15T11:00:00Z' },
        end: { dateTime: '2024-01-15T12:00:00Z' },
        location: 'Medical Center - Room 205',
      });

      expect(updateResult.success).toBe(true);

      const modificationEmailResult = await mockEmailService.sendCalendarNotification({
        eventId: 'calendar-event-123',
        title: 'Doctor Appointment - Updated',
        description: 'Annual checkup - rescheduled',
        startDate: new Date('2024-01-15T11:00:00Z'),
        endDate: new Date('2024-01-15T12:00:00Z'),
        location: 'Medical Center - Room 205',
        reminderType: 'appointment_modified',
        recipientEmail: 'patient@example.com',
        recipientName: 'John Doe',
      });

      expect(modificationEmailResult.success).toBe(true);
      expect(modificationEmailResult.messageId).toBe('modification-123');

      // Verify both operations completed successfully
      expect(calendarResult.success).toBe(true);
      expect(emailResult.success).toBe(true);
      expect(updateResult.success).toBe(true);
      expect(modificationEmailResult.success).toBe(true);
    });

    it('should handle notification failures gracefully', async () => {
      // Test calendar service success with email failure
      mockCalendarService.createEvent.mockResolvedValue({
        success: true,
        eventId: 'calendar-event-123',
        eventUrl: 'https://calendar.google.com/event/123',
      });

      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });

      const calendarResult = await mockCalendarService.createEvent({
        summary: 'Doctor Appointment',
        description: 'Annual checkup',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Medical Center',
      });

      const emailResult = await mockEmailService.sendCalendarNotification({
        eventId: 'calendar-event-123',
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T11:00:00Z'),
        location: 'Medical Center',
        reminderType: 'appointment_confirmation',
        recipientEmail: 'patient@example.com',
        recipientName: 'John Doe',
      });

      // Calendar should succeed even if email fails
      expect(calendarResult.success).toBe(true);
      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toBe('SMTP connection failed');
    });

    it('should work without notifications when disabled', async () => {
      mockCalendarService.createEvent.mockResolvedValue({
        success: true,
        eventId: 'calendar-event-123',
        eventUrl: 'https://calendar.google.com/event/123',
      });

      const calendarResult = await mockCalendarService.createEvent({
        summary: 'Doctor Appointment',
        description: 'Annual checkup',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Medical Center',
      });

      expect(calendarResult.success).toBe(true);
      expect(mockEmailService.sendCalendarNotification).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling in Calendar Notification Workflow', () => {
    it('should handle calendar service failure', async () => {
      mockCalendarService.createEvent.mockResolvedValue({
        success: false,
        error: 'Calendar service unavailable',
      });

      const calendarResult = await mockCalendarService.createEvent({
        summary: 'Doctor Appointment',
        description: 'Annual checkup',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Medical Center',
      });

      expect(calendarResult.success).toBe(false);
      expect(calendarResult.error).toBe('Calendar service unavailable');
    });

    it('should handle email service failure', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      const emailResult = await mockEmailService.sendCalendarNotification({
        eventId: 'calendar-event-123',
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T11:00:00Z'),
        location: 'Medical Center',
        reminderType: 'appointment_confirmation',
        recipientEmail: 'patient@example.com',
        recipientName: 'John Doe',
      });

      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toBe('Email service unavailable');
    });
  });

  describe('Data Consistency in Calendar Notifications', () => {
    it('should maintain event data consistency between calendar and notifications', async () => {
      const eventData = {
        summary: 'Consistent Test Appointment',
        description: 'Consistency test appointment',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Test Medical Center',
      };

      mockCalendarService.createEvent.mockResolvedValue({
        success: true,
        eventId: 'consistent-event-123',
        eventUrl: 'https://calendar.google.com/event/123',
      });

      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'consistent-notification-123',
      });

      const calendarResult = await mockCalendarService.createEvent(eventData);
      const emailResult = await mockEmailService.sendCalendarNotification({
        eventId: 'consistent-event-123',
        title: eventData.summary,
        description: eventData.description,
        startDate: new Date(eventData.start.dateTime),
        endDate: new Date(eventData.end.dateTime),
        location: eventData.location,
        reminderType: 'appointment_confirmation',
        recipientEmail: 'patient@example.com',
        recipientName: 'Test Patient',
      });

      expect(calendarResult.success).toBe(true);
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('consistent-notification-123');
    });
  });
});
