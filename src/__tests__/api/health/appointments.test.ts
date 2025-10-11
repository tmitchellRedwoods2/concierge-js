/**
 * Unit tests for Appointments API
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/health/appointments/route';
import { DELETE, PUT } from '@/app/api/health/appointments/[id]/route';
import dbConnect from '@/lib/db/mongodb';
import Appointment from '@/lib/db/models/Appointment';
import { auth } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/Appointment');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Appointments API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockAppointment = {
    _id: 'appointment-123',
    userId: 'test-user-id',
    doctorName: 'Dr. Smith',
    specialty: 'Cardiology',
    appointmentType: 'Check-up',
    appointmentDate: new Date('2024-02-01'),
    appointmentTime: '10:00 AM',
    location: 'Medical Center',
    address: '123 Health St',
    phoneNumber: '555-0123',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET /api/health/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockAppointment]),
      });
      (Appointment.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/health/appointments');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointments).toHaveLength(1);
      expect(data.appointments[0].doctorName).toBe('Dr. Smith');
      expect(mockFind).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/appointments');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      (Appointment.find as jest.Mock) = mockFind;

      const request = new NextRequest('http://localhost:3000/api/health/appointments');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/health/appointments', () => {
    it('should create a new appointment', async () => {
      (Appointment.create as jest.Mock) = jest.fn().mockResolvedValue(mockAppointment);

      const requestBody = {
        doctorName: 'Dr. Smith',
        specialty: 'Cardiology',
        appointmentType: 'Check-up',
        appointmentDate: '2024-02-01',
        appointmentTime: '10:00 AM',
        location: 'Medical Center',
        address: '123 Health St',
        phoneNumber: '555-0123',
      };

      const request = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.appointment.doctorName).toBe('Dr. Smith');
      expect(Appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          doctorName: 'Dr. Smith',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        doctorName: 'Dr. Smith',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/health/appointments/[id]', () => {
    it('should delete an appointment', async () => {
      (Appointment.findOneAndDelete as jest.Mock) = jest.fn().mockResolvedValue(mockAppointment);

      const request = new NextRequest('http://localhost:3000/api/health/appointments/appointment-123');
      const response = await DELETE(request, { params: { id: 'appointment-123' } });

      expect(response.status).toBe(200);
      expect(Appointment.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'appointment-123',
        userId: 'test-user-id',
      });
    });

    it('should return 404 if appointment not found', async () => {
      (Appointment.findOneAndDelete as jest.Mock) = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/health/appointments/nonexistent');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/appointments/appointment-123');
      const response = await DELETE(request, { params: { id: 'appointment-123' } });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/health/appointments/[id]', () => {
    it('should update an appointment', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'completed' };
      (Appointment.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(updatedAppointment);

      const requestBody = { status: 'completed' };
      const request = new NextRequest('http://localhost:3000/api/health/appointments/appointment-123', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, { params: { id: 'appointment-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointment.status).toBe('completed');
    });

    it('should return 404 if appointment not found', async () => {
      (Appointment.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/health/appointments/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });
});

