/**
 * Integration tests for Email Notifications API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/notifications/email/route';
import { auth } from '@/lib/auth';
import { EmailNotificationService } from '@/lib/services/email-notification';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/services/email-notification');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const MockEmailNotificationService = EmailNotificationService as jest.MockedClass<typeof EmailNotificationService>;

describe('Email Notifications API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockNotificationData = {
    eventId: 'event-123',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    startDate: '2024-01-15T10:00:00.000Z',
    endDate: '2024-01-15T11:00:00.000Z',
    location: 'Medical Center',
    attendees: ['patient@example.com'],
    reminderType: 'appointment_confirmation',
    recipientEmail: 'patient@example.com',
    recipientName: 'John Doe',
  };

  let mockEmailService: jest.Mocked<EmailNotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    
    // Create mock email service
    mockEmailService = {
      sendCalendarNotification: jest.fn(),
      testConnection: jest.fn(),
    } as any;
    
    MockEmailNotificationService.mockImplementation(() => mockEmailService);
  });

  describe('POST /api/notifications/email', () => {
    it('should send calendar notification successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'test-message-123',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_calendar_notification',
          notificationData: mockNotificationData,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messageId).toBe('test-message-123');
      expect(data.message).toBe('Email notification sent successfully');
      expect(mockEmailService.sendCalendarNotification).toHaveBeenCalledWith(mockNotificationData);
    });

    it('should test email service connection successfully', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test_connection',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email service connection successful');
      expect(mockEmailService.testConnection).toHaveBeenCalled();
    });

    it('should return 400 for missing notification data', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_calendar_notification',
          // Missing notificationData
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid_action',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_calendar_notification',
          notificationData: mockNotificationData,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should handle email sending failure', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_calendar_notification',
          notificationData: mockNotificationData,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle email service connection failure', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: false,
        error: 'Invalid SMTP credentials',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test_connection',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/notifications/email', () => {
    it('should return email service status successfully', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email service is configured and ready');
      expect(mockEmailService.testConnection).toHaveBeenCalled();
    });

    it('should return email service configuration issue', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: false,
        error: 'SMTP not configured',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email service configuration issue');
      expect(data.error).toBe('SMTP not configured');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/email');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle service errors gracefully', async () => {
      mockEmailService.testConnection.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/notifications/email');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
