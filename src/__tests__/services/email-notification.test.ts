/**
 * Unit tests for Email Notification Service
 */
import { EmailNotificationService, CalendarEventNotification } from '@/lib/services/email-notification';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailNotificationService', () => {
  let emailService: EmailNotificationService;
  let mockTransporter: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };
    
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
    // Set up environment variables
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'test-password';
    
    emailService = new EmailNotificationService();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@gmail.com',
          pass: 'test-password',
        },
      });
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        host: 'smtp.custom.com',
        port: 465,
        secure: true,
        auth: {
          user: 'custom@example.com',
          pass: 'custom-password',
        },
      };
      
      new EmailNotificationService(customConfig);
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('sendCalendarNotification', () => {
    const mockNotification: CalendarEventNotification = {
      eventId: 'test-event-123',
      title: 'Test Appointment',
      description: 'Test description',
      startDate: new Date('2024-01-15T10:00:00Z'),
      endDate: new Date('2024-01-15T11:00:00Z'),
      location: 'Test Location',
      attendees: ['test@example.com'],
      reminderType: 'appointment_confirmation',
      recipientEmail: 'test@example.com',
      recipientName: 'Test User',
    };

    it('should send appointment confirmation email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const result = await emailService.sendCalendarNotification(mockNotification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Concierge AI" <test@gmail.com>',
        to: 'test@example.com',
        subject: expect.stringContaining('Confirmed: Test Appointment'),
        html: expect.stringContaining('Test Appointment'),
        text: expect.stringContaining('Test Appointment'),
      });
    });

    it('should send appointment reminder email successfully', async () => {
      const reminderNotification = {
        ...mockNotification,
        reminderType: 'appointment_reminder' as const,
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'reminder-message-id-123',
      });

      const result = await emailService.sendCalendarNotification(reminderNotification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reminder-message-id-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Concierge AI" <test@gmail.com>',
        to: 'test@example.com',
        subject: expect.stringContaining('Reminder: Test Appointment'),
        html: expect.stringContaining('Appointment Reminder'),
        text: expect.stringContaining('APPOINTMENT REMINDER'),
      });
    });

    it('should send appointment cancellation email successfully', async () => {
      const cancellationNotification = {
        ...mockNotification,
        reminderType: 'appointment_cancelled' as const,
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'cancellation-message-id-123',
      });

      const result = await emailService.sendCalendarNotification(cancellationNotification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('cancellation-message-id-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Concierge AI" <test@gmail.com>',
        to: 'test@example.com',
        subject: expect.stringContaining('Cancelled: Test Appointment'),
        html: expect.stringContaining('Appointment Cancelled'),
        text: expect.stringContaining('APPOINTMENT CANCELLED'),
      });
    });

    it('should send appointment modification email successfully', async () => {
      const modificationNotification = {
        ...mockNotification,
        reminderType: 'appointment_modified' as const,
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'modification-message-id-123',
      });

      const result = await emailService.sendCalendarNotification(modificationNotification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('modification-message-id-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Concierge AI" <test@gmail.com>',
        to: 'test@example.com',
        subject: expect.stringContaining('Updated: Test Appointment'),
        html: expect.stringContaining('Appointment Updated'),
        text: expect.stringContaining('APPOINTMENT UPDATED'),
      });
    });

    it('should handle email sending failure', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const result = await emailService.sendCalendarNotification(mockNotification);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
    });

    it('should handle missing recipient email gracefully', async () => {
      const notificationWithoutEmail = {
        ...mockNotification,
        recipientEmail: '',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const result = await emailService.sendCalendarNotification(notificationWithoutEmail);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '',
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result.success).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection verification failure', async () => {
      const error = new Error('Invalid credentials');
      mockTransporter.verify.mockRejectedValue(error);

      const result = await emailService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('email templates', () => {
    const testEvent = {
      title: 'Doctor Appointment',
      startDate: new Date('2024-01-15T10:00:00Z'),
      endDate: new Date('2024-01-15T11:00:00Z'),
      location: '123 Main St',
      description: 'Annual checkup',
    };

    it('should generate correct confirmation email template', async () => {
      const notification: CalendarEventNotification = {
        eventId: 'test-123',
        ...testEvent,
        reminderType: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendCalendarNotification(notification);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(sentEmail.subject).toContain('Confirmed: Doctor Appointment');
      expect(sentEmail.html).toContain('Appointment Confirmed');
      expect(sentEmail.html).toContain('Doctor Appointment');
      expect(sentEmail.html).toContain('123 Main St');
      expect(sentEmail.html).toContain('Annual checkup');
      expect(sentEmail.text).toContain('APPOINTMENT CONFIRMED');
    });

    it('should generate correct reminder email template', async () => {
      const notification: CalendarEventNotification = {
        eventId: 'test-123',
        ...testEvent,
        reminderType: 'appointment_reminder',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendCalendarNotification(notification);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(sentEmail.subject).toContain('Reminder: Doctor Appointment');
      expect(sentEmail.html).toContain('Appointment Reminder');
      expect(sentEmail.html).toContain('This is a friendly reminder');
      expect(sentEmail.text).toContain('APPOINTMENT REMINDER');
    });

    it('should handle events without location', async () => {
      const notification: CalendarEventNotification = {
        eventId: 'test-123',
        title: 'Virtual Meeting',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T11:00:00Z'),
        reminderType: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendCalendarNotification(notification);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(sentEmail.html).not.toContain('📍');
      expect(sentEmail.text).not.toContain('📍');
    });

    it('should handle events without description', async () => {
      const notification: CalendarEventNotification = {
        eventId: 'test-123',
        title: 'Quick Call',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T10:30:00Z'),
        location: 'Office',
        reminderType: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendCalendarNotification(notification);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(sentEmail.html).toContain('Quick Call');
      expect(sentEmail.html).toContain('Office');
      expect(sentEmail.html).not.toContain('undefined');
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue('Unknown error');

      const result = await emailService.sendCalendarNotification({
        eventId: 'test-123',
        title: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        reminderType: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockTransporter.sendMail.mockRejectedValue(timeoutError);

      const result = await emailService.sendCalendarNotification({
        eventId: 'test-123',
        title: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        reminderType: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });
});
