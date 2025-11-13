/**
 * Unit tests for Health Email Parser Service
 */
import { HealthEmailParserService, ParsedPrescriptionRefill, ParsedLabResults, ParsedMedicalBill, ParsedAppointmentAvailability } from '@/lib/services/health-email-parser';

describe('HealthEmailParserService', () => {
  let parser: HealthEmailParserService;

  beforeEach(() => {
    parser = new HealthEmailParserService();
  });

  describe('parseHealthEmail', () => {
    it('should return null for non-health emails', () => {
      const email = {
        from: 'newsletter@example.com',
        subject: 'Weekly Newsletter',
        body: 'Check out our latest updates.'
      };

      const result = parser.parseHealthEmail(email);
      expect(result).toBeNull();
    });

    it('should detect and parse prescription refill emails', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Your prescription is ready for refill',
        body: 'Your prescription for LISINOPRIL 10MG TAB is ready for refill. Refill by: January 20, 2024. Order #12345'
      };

      const result = parser.parseHealthEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('prescription_refill');
      const refill = result as ParsedPrescriptionRefill;
      expect(refill.medicationName).toBeDefined();
      expect(refill.pharmacy).toContain('CVS');
      expect(refill.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('parsePrescriptionRefill', () => {
    it('should parse CVS refill email', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill Ready',
        body: 'Your prescription for LISINOPRIL 10MG TAB is ready for refill. Order #12345. Refill by January 20, 2024.'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.medicationName).toContain('LISINOPRIL');
      expect(result.pharmacy).toBe('CVS Pharmacy');
      expect(result.orderNumber).toBe('12345');
      expect(result.refillByDate).toBeInstanceOf(Date);
    });

    it('should parse Walgreens refill email', () => {
      const email = {
        from: 'noreply@walgreens.com',
        subject: 'Your prescription refill is available',
        body: 'Prescription for METFORMIN 500MG TAB is ready. Order Number: 67890'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.pharmacy).toBe('Walgreens');
      expect(result.medicationName).toContain('METFORMIN');
    });

    it('should extract medication name from various formats', () => {
      const testCases = [
        {
          body: 'Your prescription for LISINOPRIL 10MG TAB is ready',
          expected: 'LISINOPRIL'
        },
        {
          body: 'Prescription for METFORMIN 500MG is available for refill',
          expected: 'METFORMIN'
        },
        {
          body: 'Medication: ATORVASTATIN 20MG TAB',
          expected: 'ATORVASTATIN'
        }
      ];

      for (const testCase of testCases) {
        const email = {
          from: 'noreply@cvs.com',
          subject: 'Refill Ready',
          body: testCase.body
        };

        const result = (parser as any).parsePrescriptionRefill(email);
        expect(result).not.toBeNull();
        expect(result.medicationName).toContain(testCase.expected);
      }
    });

    it('should extract dosage information', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Refill Ready',
        body: 'Your prescription for LISINOPRIL 10MG TAB is ready'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.dosage).toBeDefined();
      expect(result.dosage).toContain('10MG');
    });

    it('should extract order number', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Refill Ready',
        body: 'Order #12345 is ready for pickup'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.orderNumber).toBe('12345');
    });

    it('should detect ready for pickup status', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Your prescription is ready',
        body: 'Your prescription is ready for pickup at CVS Pharmacy'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.readyForPickup).toBe(true);
    });

    it('should return null for non-pharmacy emails', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Reminder',
        body: 'Your appointment is tomorrow'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      expect(result).toBeNull();
    });
  });

  describe('parseLabResults', () => {
    it('should parse LabCorp results email', () => {
      const email = {
        from: 'results@labcorp.com',
        subject: 'Your lab results are available',
        body: 'Your test results from January 15, 2024 are now available. Tests: Complete Blood Count (CBC), Lipid Panel. Access at: https://patient.labcorp.com/results/12345'
      };

      const result = (parser as any).parseLabResults(email);
      
      expect(result).not.toBeNull();
      expect(result.labName).toBe('LabCorp');
      expect(result.testTypes.length).toBeGreaterThan(0);
      expect(result.accessUrl).toBeDefined();
    });

    it('should parse Quest Diagnostics results email', () => {
      const email = {
        from: 'noreply@questdiagnostics.com',
        subject: 'Lab Results Available',
        body: 'Your Quest Diagnostics test results are ready. Test date: January 15, 2024'
      };

      const result = (parser as any).parseLabResults(email);
      
      expect(result).not.toBeNull();
      expect(result.labName).toBe('Quest Diagnostics');
    });

    it('should extract test types', () => {
      const email = {
        from: 'results@labcorp.com',
        subject: 'Lab Results',
        body: 'Tests performed: Complete Blood Count (CBC), Lipid Panel, Blood Glucose'
      };

      const result = (parser as any).parseLabResults(email);
      
      expect(result).not.toBeNull();
      expect(result.testTypes.length).toBeGreaterThan(0);
      expect(result.testTypes.some(t => t.includes('Blood'))).toBe(true);
    });
  });

  describe('parseMedicalBill', () => {
    it('should parse medical bill email', () => {
      const email = {
        from: 'billing@hospital.com',
        subject: 'Your medical statement is ready',
        body: 'Statement Date: January 15, 2024. Amount Due: $250.00. Service: Annual Physical Exam. Provider: Dr. Smith, Internal Medicine. Due Date: February 15, 2024'
      };

      const result = (parser as any).parseMedicalBill(email);
      
      expect(result).not.toBeNull();
      expect(result.amount).toBe(250.00);
      expect(result.provider).toBeDefined();
      expect(result.service).toBeDefined();
      expect(result.dueDate).toBeInstanceOf(Date);
    });

    it('should extract amount from various formats', () => {
      const testCases = [
        { body: 'Amount Due: $250.00', expected: 250.00 },
        { body: 'Balance: $125.50', expected: 125.50 },
        { body: 'Total: $99.99', expected: 99.99 }
      ];

      for (const testCase of testCases) {
        const email = {
          from: 'billing@hospital.com',
          subject: 'Statement',
          body: testCase.body
        };

        const result = (parser as any).parseMedicalBill(email);
        if (result) {
          expect(result.amount).toBe(testCase.expected);
        }
      }
    });
  });

  describe('parseAppointmentAvailability', () => {
    it('should parse appointment availability email', () => {
      const email = {
        from: 'scheduler@drsmith.com',
        subject: 'Available appointment times',
        body: 'We have the following available times: January 20, 2024 at 10:00 AM, January 22, 2024 at 2:00 PM'
      };

      const result = (parser as any).parseAppointmentAvailability(email);
      
      expect(result).not.toBeNull();
      expect(result.availableTimes.length).toBeGreaterThan(0);
      expect(result.availableTimes[0].date).toBeInstanceOf(Date);
      expect(result.availableTimes[0].time).toBeDefined();
    });

    it('should extract multiple available times', () => {
      const email = {
        from: 'scheduler@clinic.com',
        subject: 'Appointment Options',
        body: '- January 20, 2024 at 10:00 AM\n- January 22, 2024 at 2:00 PM\n- January 25, 2024 at 11:00 AM'
      };

      const result = (parser as any).parseAppointmentAvailability(email);
      
      expect(result).not.toBeNull();
      expect(result.availableTimes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('confidence scoring', () => {
    it('should calculate confidence for prescription refill', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Prescription Refill',
        body: 'Your prescription for LISINOPRIL 10MG TAB is ready. Order #12345. Refill by January 20, 2024'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      expect(result).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should have lower confidence with missing information', () => {
      const email = {
        from: 'noreply@cvs.com',
        subject: 'Refill',
        body: 'Your prescription is ready'
      };

      const result = (parser as any).parsePrescriptionRefill(email);
      
      // Should still parse but with lower confidence
      if (result) {
        expect(result.confidence).toBeLessThan(0.8);
      }
    });
  });
});

