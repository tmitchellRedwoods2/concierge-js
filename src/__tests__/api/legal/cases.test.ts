/**
 * Unit tests for Legal Cases API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/legal/cases/route';
import dbConnect from '@/lib/db/mongodb';
import LegalCase from '@/lib/db/models/LegalCase';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/LegalCase');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Legal Cases API', () => {
  const mockSession = {
    user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
  };

  const mockCase = {
    _id: 'case-123',
    userId: 'test-user-id',
    caseNumber: 'CASE-2024-001',
    caseType: 'Contract Dispute',
    attorney: 'John Doe',
    court: 'Superior Court',
    filingDate: new Date('2024-01-01'),
    status: 'open',
    description: 'Contract dispute case',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET /api/legal/cases', () => {
    it('should return legal cases for authenticated user', async () => {
      (LegalCase.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockCase]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/legal/cases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cases).toHaveLength(1);
      expect(data.cases[0].caseNumber).toBe('CASE-2024-001');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/legal/cases');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/legal/cases', () => {
    it('should create a new legal case', async () => {
      const mockCreatedCase = { ...mockCase, save: jest.fn().mockResolvedValue(mockCase) };
      (LegalCase as any).mockImplementationOnce(() => mockCreatedCase);
      (LegalCase.findOne as jest.Mock).mockResolvedValueOnce(null); // For unique case number check

      const requestBody = {
        caseNumber: 'CASE-2024-001',
        title: 'Contract Dispute Case',
        caseType: 'Contract Dispute',
        startDate: '2024-01-01',
        description: 'Contract dispute case',
      };

      const request = new NextRequest('http://localhost:3000/api/legal/cases', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.case).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = { caseType: 'Contract Dispute' };

      const request = new NextRequest('http://localhost:3000/api/legal/cases', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
