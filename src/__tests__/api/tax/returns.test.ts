/**
 * Unit tests for Tax Returns API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tax/returns/route';
import dbConnect from '@/lib/db/mongodb';
import TaxReturn from '@/lib/db/models/TaxReturn';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/TaxReturn');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Tax Returns API', () => {
  const mockSession = {
    user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
  };

  const mockReturn = {
    _id: 'return-123',
    userId: 'test-user-id',
    taxYear: 2024,
    filingStatus: 'Single',
    income: 75000,
    deductions: 12000,
    taxOwed: 8000,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET /api/tax/returns', () => {
    it('should return tax returns for authenticated user', async () => {
      (TaxReturn.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockReturn]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tax/returns');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.returns).toHaveLength(1);
      expect(data.returns[0].taxYear).toBe(2024);
    });

    it('should filter by tax year', async () => {
      (TaxReturn.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockReturn]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tax/returns?year=2024');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(TaxReturn.find).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/tax/returns');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tax/returns', () => {
    it('should create a new tax return', async () => {
      const mockCreatedReturn = { ...mockReturn, save: jest.fn().mockResolvedValue(mockReturn) };
      (TaxReturn as any).mockImplementationOnce(() => mockCreatedReturn);

      const requestBody = {
        taxYear: 2024,
        filingStatus: 'Single',
        dueDate: '2024-04-15',
        wages: 75000,
      };

      const request = new NextRequest('http://localhost:3000/api/tax/returns', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.taxReturn.taxYear).toBe(2024);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = { taxYear: 2024 };

      const request = new NextRequest('http://localhost:3000/api/tax/returns', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should calculate tax correctly', async () => {
      const mockCreatedReturn = { ...mockReturn, save: jest.fn().mockResolvedValue(mockReturn) };
      (TaxReturn as any).mockImplementationOnce(() => mockCreatedReturn);

      const requestBody = {
        taxYear: 2024,
        filingStatus: 'Single',
        dueDate: '2024-04-15',
        wages: 75000,
      };

      const request = new NextRequest('http://localhost:3000/api/tax/returns', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.taxReturn).toBeDefined();
      expect(data.taxReturn.taxYear).toBe(2024);
    });
  });
});
