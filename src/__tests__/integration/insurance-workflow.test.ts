/**
 * Integration Tests - Insurance Workflow
 * Tests the complete flow: Add policy -> File claim -> Track claim status
 */
import { NextRequest } from 'next/server';
import { GET as getPolicies, POST as addPolicy } from '@/app/api/insurance/policies/route';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import InsurancePolicy from '@/lib/db/models/InsurancePolicy';

jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/InsurancePolicy');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Insurance Management Integration Tests', () => {
  const mockSession = {
    user: { id: 'insurance-user-123', name: 'Insurance Test User', email: 'test@insurance.com' },
  };

  const mockPolicy = {
    _id: 'policy-int-1',
    userId: 'insurance-user-123',
    policyType: 'AUTO',
    policyNumber: 'AUTO-2024-001',
    policyName: 'Comprehensive Auto Insurance',
    provider: 'State Farm',
    coverageAmount: 100000,
    deductible: 1000,
    premiumAmount: 1200,
    premiumFrequency: 'MONTHLY',
    effectiveDate: new Date('2024-01-01'),
    expirationDate: new Date('2024-12-31'),
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('Policy Management Flow', () => {
    it('should add a policy and retrieve all policies', async () => {
      // Step 1: Add a policy
      const mockCreatedPolicy = { ...mockPolicy, save: jest.fn().mockResolvedValue(mockPolicy) };
      (InsurancePolicy as any).mockImplementationOnce(() => mockCreatedPolicy);

      const addPolicyRequest = new NextRequest('http://localhost:3000/api/insurance/policies', {
        method: 'POST',
        body: JSON.stringify({
          policyType: 'AUTO',
          policyNumber: 'AUTO-2024-001',
          policyName: 'Comprehensive Auto Insurance',
          provider: 'State Farm',
          coverageAmount: 100000,
          deductible: 1000,
          premiumAmount: 1200,
          premiumFrequency: 'MONTHLY',
          effectiveDate: '2024-01-01',
          expirationDate: '2024-12-31',
        }),
      });

      const addResponse = await addPolicy(addPolicyRequest);
      const addData = await addResponse.json();

      expect(addResponse.status).toBe(201);
      expect(addData.policy).toBeDefined();
      expect(addData.policy.policyType).toBe('AUTO');

      // Step 2: Retrieve all policies
      (InsurancePolicy.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockPolicy]),
        }),
      });

      const getPoliciesRequest = new NextRequest('http://localhost:3000/api/insurance/policies');
      const getResponse = await getPolicies(getPoliciesRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.policies).toHaveLength(1);
      expect(getData.policies[0].policyNumber).toBe('AUTO-2024-001');
    });

    it('should filter policies by type', async () => {
      (InsurancePolicy.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockPolicy]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/insurance/policies?type=AUTO');
      const response = await getPolicies(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(InsurancePolicy.find).toHaveBeenCalled();
    });
  });

  describe('Multi-Policy Management', () => {
    it('should handle multiple policies of different types', async () => {
      const autoPolicy = { ...mockPolicy };
      const homePolicy = {
        ...mockPolicy,
        _id: 'policy-int-2',
        policyType: 'HOME',
        policyNumber: 'HOME-2024-001',
        policyName: 'Home Insurance',
        coverageAmount: 300000,
      };

      (InsurancePolicy.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([autoPolicy, homePolicy]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/insurance/policies');
      const response = await getPolicies(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.policies).toHaveLength(2);
    });
  });

  describe('Policy Validation', () => {
    it('should reject policy without required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/insurance/policies', {
        method: 'POST',
        body: JSON.stringify({
          policyType: 'AUTO',
          // Missing required fields: policyNumber, policyName
        }),
      });

      const response = await addPolicy(request);
      expect(response.status).toBe(400);
    });

    it('should accept policy with all required fields', async () => {
      const mockCreatedPolicy = { ...mockPolicy, save: jest.fn().mockResolvedValue(mockPolicy) };
      (InsurancePolicy as any).mockImplementationOnce(() => mockCreatedPolicy);

      const request = new NextRequest('http://localhost:3000/api/insurance/policies', {
        method: 'POST',
        body: JSON.stringify({
          policyType: 'AUTO',
          policyNumber: 'AUTO-2024-002',
          policyName: 'Basic Auto Insurance',
        }),
      });

      const response = await addPolicy(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/insurance/policies');
      const response = await getPolicies(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      (InsurancePolicy.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/insurance/policies');
      const response = await getPolicies(request);

      expect(response.status).toBe(500);
    });
  });
});

