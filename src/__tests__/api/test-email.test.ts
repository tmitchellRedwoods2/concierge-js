/**
 * Integration tests for Test Email API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/test-email/route';
import { auth } from '@/lib/auth';
import { EmailNotificationService } from '@/lib/services/email-notification';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/services/email-notification');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const MockEmailNotificationService = EmailNotificationService as jest.MockedClass<typeof EmailNotificationService>;

describe('Test Email API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
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

  describe('POST /api/test-email', () => {
    it('should send test email successfully', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'test-message-123',
      });

      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
          recipientName: 'Test User',
          testType: 'appointment_confirmation',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messageId).toBe('test-message-123');
      expect(data.message).toBe('Test email sent successfully');
      expect(data.testType).toBe('appointment_confirmation');
      expect(data.recipientEmail).toBe('test@example.com');
    });

    it('should send test email with default test type', async () => {
      mockEmailService.sendCalendarNotification.mockResolvedValue({
        success: true,
        messageId: 'test-message-456',
      });

      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.testType).toBe('appointment_confirmation');
    });

    it('should return 400 for missing recipient email', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: 'Test User',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
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

      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('SMTP connection failed');
      expect(data.message).toBe('Failed to send test email');
    });

    it('should handle service errors gracefully', async () => {
      mockEmailService.sendCalendarNotification.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/test-email', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/test-email', () => {
    it('should return email service status successfully', async () => {
      mockEmailService.testConnection.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test-email');
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

      const request = new NextRequest('http://localhost:3000/api/test-email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email service configuration issue');
      expect(data.error).toBe('SMTP not configured');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/test-email');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle service errors gracefully', async () => {
      mockEmailService.testConnection.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/test-email');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
