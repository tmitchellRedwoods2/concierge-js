/**
 * Unit tests for Prescription Matcher Service
 */
import { PrescriptionMatcherService, MatchedPrescription } from '@/lib/services/prescription-matcher';
import { ParsedPrescriptionRefill } from '@/lib/services/health-email-parser';

// Mock MongoDB
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/Prescription', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

describe('PrescriptionMatcherService', () => {
  let matcher: PrescriptionMatcherService;
  let MockPrescription: any;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PrescriptionMatcherService();
    MockPrescription = require('@/lib/db/models/Prescription').default;
  });

  describe('findMatchingPrescription', () => {
    it('should return null when no prescriptions exist', async () => {
      MockPrescription.find.mockResolvedValue([]);

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = await matcher.findMatchingPrescription(parsedRefill, 'user-123');
      
      expect(result).toBeNull();
    });

    it('should find matching prescription by medication name and pharmacy', async () => {
      const mockPrescription = {
        _id: 'prescription-123',
        userId: 'user-123',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        isActive: true,
        refillsRemaining: 3
      };

      MockPrescription.find.mockResolvedValue([mockPrescription]);

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = await matcher.findMatchingPrescription(parsedRefill, 'user-123');
      
      expect(result).not.toBeNull();
      expect(result?.prescription._id).toBe('prescription-123');
      expect(result?.matchScore).toBeGreaterThan(0.6);
    });

    it('should return null if match score is too low', async () => {
      const mockPrescription = {
        _id: 'prescription-123',
        userId: 'user-123',
        medicationName: 'DIFFERENT MEDICATION',
        dosage: '20MG',
        pharmacy: 'Walgreens',
        isActive: true
      };

      MockPrescription.find.mockResolvedValue([mockPrescription]);

      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const result = await matcher.findMatchingPrescription(parsedRefill, 'user-123');
      
      // Should return null because match score is too low
      expect(result).toBeNull();
    });
  });

  describe('calculateMatch', () => {
    it('should match by exact medication name', () => {
      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const prescription = {
        _id: 'prescription-123',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy'
      };

      const result = (matcher as any).calculateMatch(parsedRefill, prescription);
      
      expect(result.matchScore).toBeGreaterThan(0.6);
      expect(result.matchReasons.length).toBeGreaterThan(0);
    });

    it('should match by partial medication name', () => {
      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL 10MG',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const prescription = {
        _id: 'prescription-123',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy'
      };

      const result = (matcher as any).calculateMatch(parsedRefill, prescription);
      
      expect(result.matchScore).toBeGreaterThan(0.6);
    });

    it('should match by pharmacy even if medication name differs slightly', () => {
      const parsedRefill: ParsedPrescriptionRefill = {
        type: 'prescription_refill',
        medicationName: 'LISINOPRIL 10MG TAB',
        dosage: '10MG',
        pharmacy: 'CVS Pharmacy',
        confidence: 0.9
      };

      const prescription = {
        _id: 'prescription-123',
        medicationName: 'LISINOPRIL',
        dosage: '10MG TAB',
        pharmacy: 'CVS Pharmacy'
      };

      const result = (matcher as any).calculateMatch(parsedRefill, prescription);
      
      expect(result.matchScore).toBeGreaterThan(0.5);
      expect(result.matchReasons.some(r => r.includes('Pharmacy'))).toBe(true);
    });
  });

  describe('matchMedicationName', () => {
    it('should match exact medication names', () => {
      const result = (matcher as any).matchMedicationName('LISINOPRIL', 'LISINOPRIL');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should match partial medication names', () => {
      const result = (matcher as any).matchMedicationName('LISINOPRIL 10MG', 'LISINOPRIL');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should match base names without dosage', () => {
      const result = (matcher as any).matchMedicationName('LISINOPRIL 10MG TAB', 'LISINOPRIL 20MG');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should not match completely different medications', () => {
      const result = (matcher as any).matchMedicationName('LISINOPRIL', 'METFORMIN');
      
      expect(result.matched).toBe(false);
    });
  });

  describe('matchPharmacy', () => {
    it('should match exact pharmacy names', () => {
      const result = (matcher as any).matchPharmacy('CVS Pharmacy', 'CVS Pharmacy');
      
      expect(result.matched).toBe(true);
    });

    it('should match pharmacy variants', () => {
      const result = (matcher as any).matchPharmacy('CVS', 'CVS Pharmacy');
      
      expect(result.matched).toBe(true);
    });

    it('should match pharmacy groups', () => {
      const result = (matcher as any).matchPharmacy('Rite Aid', 'RiteAid');
      
      expect(result.matched).toBe(true);
    });

    it('should not match different pharmacies', () => {
      const result = (matcher as any).matchPharmacy('CVS Pharmacy', 'Walgreens');
      
      expect(result.matched).toBe(false);
    });
  });

  describe('matchDosage', () => {
    it('should match exact dosages', () => {
      const result = (matcher as any).matchDosage('10MG', '10MG');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should match normalized dosages', () => {
      const result = (matcher as any).matchDosage('10 MG', '10MG');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should match numeric values', () => {
      const result = (matcher as any).matchDosage('10MG TAB', '10MG CAP');
      
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should not match different dosages', () => {
      const result = (matcher as any).matchDosage('10MG', '20MG');
      
      expect(result.matched).toBe(false);
    });
  });
});

