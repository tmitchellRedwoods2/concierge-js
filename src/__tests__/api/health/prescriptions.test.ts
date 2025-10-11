/**
 * Unit tests for Prescriptions API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/health/prescriptions/route';
import { DELETE, PUT } from '@/app/api/health/prescriptions/[id]/route';
import dbConnect from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import { auth } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/Prescription');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Prescriptions API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockPrescription = {
    _id: 'prescription-123',
    userId: 'test-user-id',
    medicationName: 'Test Medication',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: new Date('2024-01-01'),
    prescribingDoctor: 'Dr. Smith',
    pharmacy: 'Test Pharmacy',
    refillsRemaining: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET /api/health/prescriptions', () => {
    it('should return prescriptions for authenticated user', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockPrescription]),
      });
      (Prescription.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prescriptions).toHaveLength(1);
      expect(data.prescriptions[0].medicationName).toBe('Test Medication');
      expect(mockFind).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      (Prescription.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/health/prescriptions', () => {
    it('should create a new prescription', async () => {
      (Prescription.create as jest.Mock) = jest.fn().mockResolvedValue(mockPrescription);

      const requestBody = {
        medicationName: 'Test Medication',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: '2024-01-01',
        prescribingDoctor: 'Dr. Smith',
        pharmacy: 'Test Pharmacy',
        refillsRemaining: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.prescription.medicationName).toBe('Test Medication');
      expect(Prescription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          medicationName: 'Test Medication',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        medicationName: 'Test Medication',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/health/prescriptions/[id]', () => {
    it('should delete a prescription', async () => {
      (Prescription.findOneAndDelete as jest.Mock) = jest.fn().mockResolvedValue(mockPrescription);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions/prescription-123');
      const response = await DELETE(request, { params: { id: 'prescription-123' } });

      expect(response.status).toBe(200);
      expect(Prescription.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'prescription-123',
        userId: 'test-user-id',
      });
    });

    it('should return 404 if prescription not found', async () => {
      (Prescription.findOneAndDelete as jest.Mock) = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions/nonexistent');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions/prescription-123');
      const response = await DELETE(request, { params: { id: 'prescription-123' } });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/health/prescriptions/[id]', () => {
    it('should update a prescription', async () => {
      const updatedPrescription = { ...mockPrescription, dosage: '20mg' };
      (Prescription.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(updatedPrescription);

      const requestBody = { dosage: '20mg' };
      const request = new NextRequest('http://localhost:3000/api/health/prescriptions/prescription-123', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, { params: { id: 'prescription-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prescription.dosage).toBe('20mg');
    });

    it('should return 404 if prescription not found', async () => {
      (Prescription.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });
});

