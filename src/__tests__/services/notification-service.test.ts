/**
 * Unit tests for Notification Service
 */
import { NotificationService, NotificationPreferences } from '@/lib/services/notification-service';
import { EmailNotificationService } from '@/lib/services/email-notification';

// Mock the email notification service
jest.mock('@/lib/services/email-notification', () => ({
  EmailNotificationService: jest.fn(),
}));

const MockEmailNotificationService = EmailNotificationService as jest.MockedClass<typeof EmailNotificationService>;

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailNotificationService>;

  const mockEvent = {
    _id: 'event-123',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    location: 'Medical Center',
    attendees: ['patient@example.com'],
  };

  const mockPreferences: NotificationPreferences = {
    email: true,
    sms: false,
    push: false,
    reminderMinutes: [15, 60, 1440], // 15 min, 1 hour, 1 day
    appointmentTypes: {
      medical: true,
      business: false,
      personal: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock email service
    mockEmailService = {
      sendCalendarNotification: jest.fn(),
      testConnection: jest.fn(),
    } as any;
    
    MockEmailNotificationService.mockImplementation(() => mockEmailService);
    
    notificationService = new NotificationService();
  });

  describe('scheduleAppointmentReminders', () => {
    it('should schedule confirmation and reminder notifications', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'confirmation-123',
      });

      const result = await notificationService.scheduleAppointmentReminders(
        mockEvent,
        'user-123',
        mockPreferences
      );

      expect(result.success).toBe(true);
      expect(result.scheduled).toBeGreaterThan(0);
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-123',
          title: 'Doctor Appointment',
          reminderType: 'appointment_confirmation',
          recipientEmail: 'patient@example.com',
        })
      );
    });

    it('should handle email sending failure gracefully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: false,
        error: 'SMTP error',
      });

      const result = await notificationService.scheduleAppointmentReminders(
        mockEvent,
        'user-123',
        mockPreferences
      );

      expect(result.success).toBe(true); // Should still succeed even if email fails
      expect(result.scheduled).toBeGreaterThan(0);
    });

    it('should not schedule reminders for past events', async () => {
      const pastEvent = {
        ...mockEvent,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      const result = await notificationService.scheduleAppointmentReminders(
        pastEvent,
        'user-123',
        mockPreferences
      );

      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(1); // Only confirmation, no reminders
    });

    it('should handle events without attendees', async () => {
      const eventWithoutAttendees = {
        ...mockEvent,
        attendees: undefined,
      };

      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'test-123',
      });

      const result = await notificationService.scheduleAppointmentReminders(
        eventWithoutAttendees,
        'user-123',
        mockPreferences
      );

      expect(result.success).toBe(true);
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'user@example.com', // Default fallback
        })
      );
    });
  });

  describe('sendAppointmentConfirmation', () => {
    it('should send confirmation email successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'confirmation-123',
      });

      const result = await notificationService.sendAppointmentConfirmation(
        mockEvent,
        'user-123',
        'patient@example.com',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('confirmation-123');
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderType: 'appointment_confirmation',
          recipientEmail: 'patient@example.com',
          recipientName: 'John Doe',
        })
      );
    });

    it('should handle email sending failure', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });

      const result = await notificationService.sendAppointmentConfirmation(
        mockEvent,
        'user-123',
        'patient@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
    });
  });

  describe('sendAppointmentReminder', () => {
    it('should send reminder email successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'reminder-123',
      });

      const result = await notificationService.sendAppointmentReminder(
        mockEvent,
        'user-123',
        'patient@example.com',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reminder-123');
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderType: 'appointment_reminder',
          recipientEmail: 'patient@example.com',
          recipientName: 'John Doe',
        })
      );
    });
  });

  describe('sendAppointmentCancellation', () => {
    it('should send cancellation email successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'cancellation-123',
      });

      const result = await notificationService.sendAppointmentCancellation(
        mockEvent,
        'user-123',
        'patient@example.com',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('cancellation-123');
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderType: 'appointment_cancelled',
          recipientEmail: 'patient@example.com',
          recipientName: 'John Doe',
        })
      );
    });
  });

  describe('sendAppointmentModification', () => {
    it('should send modification email successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'modification-123',
      });

      const result = await notificationService.sendAppointmentModification(
        mockEvent,
        'user-123',
        'patient@example.com',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('modification-123');
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderType: 'appointment_modified',
          recipientEmail: 'patient@example.com',
          recipientName: 'John Doe',
        })
      );
    });
  });

  describe('testEmailService', () => {
    it('should test email service connection successfully', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: true,
      });

      const result = await notificationService.testEmailService();

      expect(result.success).toBe(true);
      expect(mockEmailService.testConnection).toHaveBeenCalled();
    });

    it('should handle email service connection failure', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: false,
        error: 'SMTP configuration error',
      });

      const result = await notificationService.testEmailService();

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP configuration error');
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      mockEmailService.sendCalendarNotification.mockRejectedValue('Unknown error');

      const result = await notificationService.sendAppointmentConfirmation(
        mockEvent,
        'user-123',
        'patient@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      mockEmailService.sendCalendarNotification.mockRejectedValue(timeoutError);

      const result = await notificationService.sendAppointmentReminder(
        mockEvent,
        'user-123',
        'patient@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });
});
