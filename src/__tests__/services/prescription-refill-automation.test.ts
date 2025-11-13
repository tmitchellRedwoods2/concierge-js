/**
 * Unit tests for Prescription Refill Automation Service
 */
import { PrescriptionRefillAutomationService, RefillRequestResult } from '@/lib/services/prescription-refill-automation';
import { ParsedPrescriptionRefill } from '@/lib/services/health-email-parser';
import { prescriptionMatcherService } from '@/lib/services/prescription-matcher';

// Mock dependencies
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/services/prescription-matcher');
jest.mock('@/lib/services/notification-service');

const mockPrescriptionMatcher = prescriptionMatcherService as jest.Mocked<typeof prescriptionMatcherService>;

describe('PrescriptionRefillAutomationService', () => {
  let automationService: PrescriptionRefillAutomationService;

  beforeEach(() => {
    jest.clearAllMocks();
    automationService = new PrescriptionRefillAutomationService();
  });

  describe('processRefillRequest', () => {
    const mockPrescription = {
      _id: 'prescription-123',
      userId: 'user-123',
      medicationName: 'LISINOPRIL',
      dosage: '10MG TAB',
      pharmacy: 'CVS Pharmacy',
      isActive: true,
      refillsRemaining: 3,
      autoRefillEnabled: false,
      refillHistory: [],
      save: jest.fn().mockResolvedValue(true)
    };

    const parsedRefill: ParsedPrescriptionRefill = {
      type: 'prescription_refill',
      medicationName: 'LISINOPRIL',
      dosage: '10MG TAB',
      pharmacy: 'CVS Pharmacy',
      confidence: 0.9
    };

    it('should return error if no matching prescription found', async () => {
      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue(null);

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No matching prescription');
    });

    it('should return error if prescription is not active', async () => {
      const inactivePrescription = {
        ...mockPrescription,
        isActive: false
      };

      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: inactivePrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should return error if no refills remaining', async () => {
      const noRefillsPrescription = {
        ...mockPrescription,
        refillsRemaining: 0
      };

      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: noRefillsPrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No refills remaining');
    });

    it('should process refill request when auto-request is enabled', async () => {
      const autoRefillPrescription = {
        ...mockPrescription,
        autoRefillEnabled: true
      };

      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: autoRefillPrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(true);
      expect(result.refillRequested).toBe(true);
      expect(result.prescriptionId).toBe('prescription-123');
    });

    it('should process refill request when explicitly requested', async () => {
      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: mockPrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        true // Explicitly request
      );

      expect(result.success).toBe(true);
      expect(result.refillRequested).toBe(true);
    });

    it('should send notification when refill is available but not auto-requested', async () => {
      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: mockPrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(true);
      expect(result.refillRequested).toBe(false);
      expect(result.message).toContain('notification sent');
    });

    it('should update prescription after refill request', async () => {
      const prescription = {
        ...mockPrescription,
        autoRefillEnabled: true,
        refillHistory: []
      };

      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        false
      );

      expect(result.success).toBe(true);
      expect(prescription.save).toHaveBeenCalled();
      expect(prescription.refillsRemaining).toBe(2); // Decremented
      expect(prescription.lastRefillRequestDate).toBeDefined();
    });

    it('should prevent duplicate refill requests within 24 hours', async () => {
      const recentRefillPrescription = {
        ...mockPrescription,
        lastRefillRequestDate: new Date() // Just requested
      };

      mockPrescriptionMatcher.findMatchingPrescription.mockResolvedValue({
        prescription: recentRefillPrescription,
        matchScore: 0.9,
        matchReasons: ['Exact match']
      });

      const result = await automationService.processRefillRequest(
        parsedRefill,
        'user-123',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already requested');
    });
  });

  describe('checkRefillEligibility', () => {
    it('should check if prescription is eligible for refill', () => {
      const eligiblePrescription = {
        isActive: true,
        refillsRemaining: 3,
        lastRefillRequestDate: null
      };

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = (automationService as any).checkRefillEligibility(
        eligiblePrescription,
        parsedRefill
      );

      expect(result.eligible).toBe(true);
    });

    it('should reject inactive prescriptions', () => {
      const inactivePrescription = {
        isActive: false,
        refillsRemaining: 3
      };

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = (automationService as any).checkRefillEligibility(
        inactivePrescription,
        parsedRefill
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('not active');
    });

    it('should reject prescriptions with no refills remaining', () => {
      const noRefillsPrescription = {
        isActive: true,
        refillsRemaining: 0
      };

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = (automationService as any).checkRefillEligibility(
        noRefillsPrescription,
        parsedRefill
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('No refills remaining');
    });
  });

  describe('calculateNextRefillDate', () => {
    it('should calculate next refill date for daily medication', () => {
      const prescription = {
        quantity: 30,
        frequency: 'Once daily'
      };

      const result = (automationService as any).calculateNextRefillDate(prescription);
      
      expect(result).toBeInstanceOf(Date);
      const daysDiff = (result.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(30, 0);
    });

    it('should calculate next refill date for twice daily medication', () => {
      const prescription = {
        quantity: 60,
        frequency: 'Twice daily'
      };

      const result = (automationService as any).calculateNextRefillDate(prescription);
      
      expect(result).toBeInstanceOf(Date);
      const daysDiff = (result.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(30, 0); // 60 pills / 2 per day = 30 days
    });
  });
});

