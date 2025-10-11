/**
 * Unit tests for Insurance Policies API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/insurance/policies/route';
import dbConnect from '@/lib/db/mongodb';
import InsurancePolicy from '@/lib/db/models/InsurancePolicy';
import { auth } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/InsurancePolicy');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Insurance Policies API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockPolicy = {
    _id: 'policy-123',
    userId: 'test-user-id',
    policyType: 'Auto',
    provider: 'Test Insurance Co',
    policyNumber: 'POL-123456',
    coverage: 100000,
    premium: 1200,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET /api/insurance/policies', () => {
    it('should return policies for authenticated user', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockPolicy]),
      });
      (InsurancePolicy.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/insurance/policies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.policies).toHaveLength(1);
      expect(data.policies[0].policyType).toBe('Auto');
    });

    it('should filter by policy type', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockPolicy]),
      });
      (InsurancePolicy.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/insurance/policies?type=Auto');
      const response = await GET(request);

      expect(mockFind).toHaveBeenCalledWith({
        userId: 'test-user-id',
        policyType: 'Auto',
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/insurance/policies');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/insurance/policies', () => {
    it('should create a new policy', async () => {
      (InsurancePolicy.create as jest.Mock) = jest.fn().mockResolvedValue(mockPolicy);

      const requestBody = {
        policyType: 'Auto',
        provider: 'Test Insurance Co',
        policyNumber: 'POL-123456',
        coverage: 100000,
        premium: 1200,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const request = new NextRequest('http://localhost:3000/api/insurance/policies', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.policy.policyType).toBe('Auto');
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        policyType: 'Auto',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/insurance/policies', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

