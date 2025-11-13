/**
 * Integration tests for Health Email Webhook API Route
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/health/email/webhook/route';
import connectDB from '@/lib/db/mongodb';
import { healthEmailParserService } from '@/lib/services/health-email-parser';
import { prescriptionRefillAutomationService } from '@/lib/services/prescription-refill-automation';
import { emailTriggerService } from '@/lib/services/email-trigger';

// Mock dependencies
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/services/health-email-parser');
jest.mock('@/lib/services/prescription-refill-automation');
jest.mock('@/lib/services/email-trigger');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockHealthEmailParser = healthEmailParserService as jest.Mocked<typeof healthEmailParserService>;
const mockRefillAutomation = prescriptionRefillAutomationService as jest.Mocked<typeof prescriptionRefillAutomationService>;
const mockEmailTrigger = emailTriggerService as jest.Mocked<typeof emailTriggerService>;

describe('Health Email Webhook API Route', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    (mockEmailTrigger.processEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe('Webhook Security', () => {
    it('should reject requests without webhook secret when secret is configured', async () => {
      process.env.HEALTH_EMAIL_WEBHOOK_SECRET = 'test-secret';
      
      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        body: 'Your prescription is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      
      delete process.env.HEALTH_EMAIL_WEBHOOK_SECRET;
    });

    it('should accept requests with correct webhook secret', async () => {
      process.env.HEALTH_EMAIL_WEBHOOK_SECRET = 'test-secret';
      
      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        body: 'Your prescription is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'test-secret'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      delete process.env.HEALTH_EMAIL_WEBHOOK_SECRET;
    });
  });

  describe('Email Format Support', () => {
    it('should handle SendGrid email format', async () => {
      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        text: 'Your prescription is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockHealthEmailParser.parseHealthEmail).toHaveBeenCalled();
    });

    it('should handle Mailgun email format', async () => {
      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(null);
      
      const body = {
        sender: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        'body-plain': 'Your prescription is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Prescription Refill Processing', () => {
    it('should process prescription refill email', async () => {
      const mockParsedRefill = {
        type: 'prescription_refill' as const,
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedRefill);
      (mockRefillAutomation.processRefillRequest as jest.Mock) = jest.fn().mockResolvedValue({
        success: true,
        refillRequested: true,
        prescriptionId: 'prescription-123',
        message: 'Refill requested successfully'
      });

      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill Ready',
        body: 'Your prescription for LISINOPRIL is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.healthDataProcessed).toBe(true);
      expect(data.result.type).toBe('prescription_refill');
      expect(mockRefillAutomation.processRefillRequest).toHaveBeenCalled();
    });

    it('should handle auto-request flag', async () => {
      const mockParsedRefill = {
        type: 'prescription_refill' as const,
        medicationName: 'LISINOPRIL',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(mockParsedRefill);
      (mockRefillAutomation.processRefillRequest as jest.Mock) = jest.fn().mockResolvedValue({
        success: true,
        refillRequested: true,
        prescriptionId: 'prescription-123'
      });

      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        body: 'Your prescription is ready',
        userId: mockUserId,
        autoRequest: true
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      await POST(request);

      expect(mockRefillAutomation.processRefillRequest).toHaveBeenCalledWith(
        mockParsedRefill,
        mockUserId,
        true // autoRequest should be true
      );
    });
  });

  describe('Other Health Email Types', () => {
    it('should handle lab results email', async () => {
      const mockLabResults = {
        type: 'lab_results' as const,
        labName: 'LabCorp',
        testDate: new Date(),
        testTypes: ['CBC'],
        confidence: 0.9
      };

      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(mockLabResults);

      const body = {
        from: 'results@labcorp.com',
        subject: 'Lab Results Available',
        body: 'Your test results are ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.type).toBe('lab_results');
    });

    it('should handle medical bill email', async () => {
      const mockBill = {
        type: 'medical_bill' as const,
        provider: 'Dr. Smith',
        service: 'Annual Physical',
        amount: 250.00,
        statementDate: new Date(),
        dueDate: new Date(),
        confidence: 0.9
      };

      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockReturnValue(mockBill);

      const body = {
        from: 'billing@hospital.com',
        subject: 'Medical Statement',
        body: 'Your statement is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.type).toBe('medical_bill');
    });
  });

  describe('GET Endpoint', () => {
    it('should return status message', async () => {
      const request = new NextRequest('http://localhost:3000/api/health/email/webhook');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Health email webhook endpoint is active');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle parsing errors gracefully', async () => {
      (mockHealthEmailParser.parseHealthEmail as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Parsing failed');
      });

      const body = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        body: 'Your prescription is ready',
        userId: mockUserId
      };

      const request = new NextRequest('http://localhost:3000/api/health/email/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

