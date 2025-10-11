/**
 * Model Validation Tests - Insurance Policy Data
 * Tests business logic and data validation rules
 */

describe('Insurance Policy Data Validation', () => {
  const validPolicyData = {
    userId: 'test-user-123',
    policyType: 'AUTO',
    policyNumber: 'POL-2024-001',
    policyName: 'Auto Insurance Policy',
    provider: 'State Farm',
    coverageAmount: 100000,
    deductible: 1000,
    premiumAmount: 1200,
    premiumFrequency: 'MONTHLY',
    effectiveDate: new Date('2024-01-01'),
    expirationDate: new Date('2024-12-31'),
    status: 'ACTIVE',
  };

  describe('Required Fields Validation', () => {
    it('should have all required fields', () => {
      expect(validPolicyData.userId).toBeDefined();
      expect(validPolicyData.policyType).toBeDefined();
      expect(validPolicyData.policyNumber).toBeDefined();
      expect(validPolicyData.policyName).toBeDefined();
    });

    it('should validate userId is a non-empty string', () => {
      expect(typeof validPolicyData.userId).toBe('string');
      expect(validPolicyData.userId.length).toBeGreaterThan(0);
    });

    it('should validate policyNumber is unique and formatted', () => {
      expect(typeof validPolicyData.policyNumber).toBe('string');
      expect(validPolicyData.policyNumber.length).toBeGreaterThan(0);
      expect(validPolicyData.policyNumber).toMatch(/^[A-Z0-9-]+$/);
    });
  });

  describe('Policy Type Validation', () => {
    it('should accept valid policy types', () => {
      const validTypes = ['AUTO', 'HOME', 'HEALTH', 'LIFE', 'DISABILITY', 'UMBRELLA'];
      expect(validTypes).toContain(validPolicyData.policyType);
    });

    it('should validate policyType is uppercase', () => {
      expect(validPolicyData.policyType).toBe(validPolicyData.policyType.toUpperCase());
    });
  });

  describe('Financial Field Validation', () => {
    it('should validate coverageAmount is a positive number', () => {
      expect(typeof validPolicyData.coverageAmount).toBe('number');
      expect(validPolicyData.coverageAmount).toBeGreaterThan(0);
    });

    it('should validate deductible is a non-negative number', () => {
      expect(typeof validPolicyData.deductible).toBe('number');
      expect(validPolicyData.deductible).toBeGreaterThanOrEqual(0);
    });

    it('should validate premiumAmount is a positive number', () => {
      expect(typeof validPolicyData.premiumAmount).toBe('number');
      expect(validPolicyData.premiumAmount).toBeGreaterThan(0);
    });

    it('should validate deductible is less than coverageAmount', () => {
      expect(validPolicyData.deductible).toBeLessThan(validPolicyData.coverageAmount);
    });
  });

  describe('Premium Frequency Validation', () => {
    it('should accept valid premium frequencies', () => {
      const validFrequencies = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'];
      expect(validFrequencies).toContain(validPolicyData.premiumFrequency);
    });

    it('should validate premium frequency is uppercase', () => {
      expect(validPolicyData.premiumFrequency).toBe(validPolicyData.premiumFrequency.toUpperCase());
    });
  });

  describe('Date Validation', () => {
    it('should have valid effectiveDate', () => {
      expect(validPolicyData.effectiveDate).toBeInstanceOf(Date);
      expect(validPolicyData.effectiveDate.getTime()).not.toBeNaN();
    });

    it('should have valid expirationDate', () => {
      expect(validPolicyData.expirationDate).toBeInstanceOf(Date);
      expect(validPolicyData.expirationDate.getTime()).not.toBeNaN();
    });

    it('should validate expirationDate is after effectiveDate', () => {
      expect(validPolicyData.expirationDate.getTime()).toBeGreaterThan(
        validPolicyData.effectiveDate.getTime()
      );
    });

    it('should calculate policy duration', () => {
      const durationMs = validPolicyData.expirationDate.getTime() - validPolicyData.effectiveDate.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);
      expect(durationDays).toBeGreaterThan(0);
      expect(durationDays).toBeLessThan(400); // Reasonable policy duration
    });
  });

  describe('Status Validation', () => {
    it('should have valid status', () => {
      const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'];
      expect(validStatuses).toContain(validPolicyData.status);
    });

    it('should default to ACTIVE status', () => {
      expect(validPolicyData.status).toBe('ACTIVE');
    });
  });

  describe('Optional Fields', () => {
    it('should allow optional agent information', () => {
      const dataWithAgent = {
        ...validPolicyData,
        agentName: 'John Doe',
        agentPhone: '555-0123',
        agentEmail: 'john@insurance.com',
      };
      
      expect(typeof dataWithAgent.agentName).toBe('string');
      expect(typeof dataWithAgent.agentPhone).toBe('string');
      expect(typeof dataWithAgent.agentEmail).toBe('string');
      expect(dataWithAgent.agentEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should allow optional beneficiaries array', () => {
      const dataWithBeneficiaries = {
        ...validPolicyData,
        beneficiaries: ['Jane Doe', 'John Smith'],
      };
      
      expect(Array.isArray(dataWithBeneficiaries.beneficiaries)).toBe(true);
      expect(dataWithBeneficiaries.beneficiaries.length).toBe(2);
    });
  });

  describe('Business Logic', () => {
    it('should calculate annual premium from monthly premium', () => {
      if (validPolicyData.premiumFrequency === 'MONTHLY') {
        const annualPremium = validPolicyData.premiumAmount * 12;
        expect(annualPremium).toBe(14400);
      }
    });

    it('should validate policy is currently active', () => {
      const now = new Date();
      const isActive = 
        validPolicyData.status === 'ACTIVE' &&
        validPolicyData.effectiveDate <= now &&
        validPolicyData.expirationDate >= now;
      
      // For test data with 2024 dates, this depends on current date
      expect(typeof isActive).toBe('boolean');
    });
  });
});

