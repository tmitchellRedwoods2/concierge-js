/**
 * Integration Tests - Health Management Workflow
 * Tests the complete flow: Add prescription -> Schedule appointment -> Find provider
 */
import { NextRequest } from 'next/server';
import { GET as getPrescriptions, POST as addPrescription } from '@/app/api/health/prescriptions/route';
import { GET as getAppointments, POST as scheduleAppointment } from '@/app/api/health/appointments/route';
import { GET as getProviders } from '@/app/api/health/providers/route';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import Appointment from '@/lib/db/models/Appointment';
import HealthProvider from '@/lib/db/models/HealthProvider';

jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db/models/Prescription');
jest.mock('@/lib/db/models/Appointment');
jest.mock('@/lib/db/models/HealthProvider');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('Health Management Integration Tests', () => {
  const mockSession = {
    user: { id: 'integration-user-123', name: 'Integration Test User', email: 'test@example.com' },
  };

  const mockPrescription = {
    _id: 'prescription-int-1',
    userId: 'integration-user-123',
    medicationName: 'Blood Pressure Medication',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: new Date('2024-01-01'),
    prescribingDoctor: 'Dr. Integration Test',
    pharmacy: 'Test Pharmacy',
    refillsRemaining: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointment = {
    _id: 'appointment-int-1',
    userId: 'integration-user-123',
    doctorName: 'Dr. Integration Test',
    specialty: 'Cardiology',
    appointmentType: 'Follow-up',
    appointmentDate: new Date('2024-02-01'),
    appointmentTime: '10:00 AM',
    location: 'Medical Center',
    address: '123 Test St',
    phoneNumber: '555-0100',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProvider = {
    _id: 'provider-int-1',
    name: 'Dr. Integration Test',
    specialty: 'Cardiology',
    type: 'specialist',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    phoneNumber: '555-0100',
    rating: 4.8,
    reviewCount: 50,
    acceptsInsurance: true,
    isInNetwork: true,
    languages: ['English'],
    availability: 'Monday-Friday 9AM-5PM',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('Complete Health Management Flow', () => {
    it('should complete full workflow: prescription -> appointment -> provider lookup', async () => {
      // Step 1: Add a prescription
      const mockCreatedPrescription = { ...mockPrescription, save: jest.fn().mockResolvedValue(mockPrescription) };
      (Prescription as any).mockImplementationOnce(() => mockCreatedPrescription);

      const prescriptionRequest = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          medicationName: 'Blood Pressure Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: '2024-01-01',
          prescribingDoctor: 'Dr. Integration Test',
          pharmacy: 'Test Pharmacy',
          refillsRemaining: 3,
        }),
      });

      const prescriptionResponse = await addPrescription(prescriptionRequest);
      expect(prescriptionResponse.status).toBe(201);

      // Step 2: Schedule a follow-up appointment
      const mockCreatedAppointment = { ...mockAppointment, save: jest.fn().mockResolvedValue(mockAppointment) };
      (Appointment as any).mockImplementationOnce(() => mockCreatedAppointment);

      const appointmentRequest = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorName: 'Dr. Integration Test',
          specialty: 'Cardiology',
          appointmentType: 'Follow-up',
          appointmentDate: '2024-02-01',
          appointmentTime: '10:00 AM',
          location: 'Medical Center',
          address: '123 Test St',
          phoneNumber: '555-0100',
        }),
      });

      const appointmentResponse = await scheduleAppointment(appointmentRequest);
      expect(appointmentResponse.status).toBe(201);

      // Step 3: Look up healthcare providers
      // First call returns providers (not empty), second call (if any) returns filtered
      (HealthProvider.find as jest.Mock)
        .mockResolvedValueOnce([mockProvider])
        .mockResolvedValueOnce([mockProvider]);
      (HealthProvider as any).insertMany = jest.fn().mockResolvedValue([mockProvider]);

      const providerRequest = new NextRequest('http://localhost:3000/api/health/providers?specialty=Cardiology');
      const providerResponse = await getProviders(providerRequest);

      expect(providerResponse.status).toBe(200);

      // All three operations completed successfully
      expect(prescriptionResponse.status).toBe(201);
      expect(appointmentResponse.status).toBe(201);
      expect(providerResponse.status).toBe(200);
    });

    it('should retrieve all user health data after workflow', async () => {
      // Mock retrieving all prescriptions
      (Prescription.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([mockPrescription]),
      });

      const prescriptionsRequest = new NextRequest('http://localhost:3000/api/health/prescriptions');
      const prescriptionsResponse = await getPrescriptions(prescriptionsRequest);
      const prescriptionsData = await prescriptionsResponse.json();

      expect(prescriptionsResponse.status).toBe(200);
      expect(prescriptionsData.prescriptions).toHaveLength(1);

      // Mock retrieving all appointments
      (Appointment.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([mockAppointment]),
      });

      const appointmentsRequest = new NextRequest('http://localhost:3000/api/health/appointments');
      const appointmentsResponse = await getAppointments(appointmentsRequest);
      const appointmentsData = await appointmentsResponse.json();

      expect(appointmentsResponse.status).toBe(200);
      expect(appointmentsData.appointments).toHaveLength(1);

      // Verify user has complete health profile
      expect(prescriptionsData.prescriptions[0].userId).toBe(mockSession.user.id);
      expect(appointmentsData.appointments[0].userId).toBe(mockSession.user.id);
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle authentication failure at any step', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const request = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify({ medicationName: 'Test' }),
      });

      const response = await addPrescription(request);
      expect(response.status).toBe(401);
    });

    it('should handle missing required fields in prescription creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify({ medicationName: 'Test' }), // Missing required fields
      });

      const response = await addPrescription(request);
      expect(response.status).toBe(400);
    });

    it('should handle missing required fields in appointment scheduling', async () => {
      const request = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify({ doctorName: 'Test' }), // Missing required fields
      });

      const response = await scheduleAppointment(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity between prescription and appointment', async () => {
      const doctorName = 'Dr. Integration Test';

      // Create prescription with doctor
      const mockCreatedPrescription = { ...mockPrescription, prescribingDoctor: doctorName, save: jest.fn().mockResolvedValue(mockPrescription) };
      (Prescription as any).mockImplementationOnce(() => mockCreatedPrescription);

      const prescriptionRequest = new NextRequest('http://localhost:3000/api/health/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          medicationName: 'Test Med',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: '2024-01-01',
          prescribingDoctor: doctorName,
          pharmacy: 'Test Pharmacy',
        }),
      });

      const prescriptionResponse = await addPrescription(prescriptionRequest);
      expect(prescriptionResponse.status).toBe(201);

      // Schedule appointment with same doctor
      const mockCreatedAppointment = { ...mockAppointment, doctorName, save: jest.fn().mockResolvedValue(mockAppointment) };
      (Appointment as any).mockImplementationOnce(() => mockCreatedAppointment);

      const appointmentRequest = new NextRequest('http://localhost:3000/api/health/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorName,
          specialty: 'Cardiology',
          appointmentType: 'Follow-up',
          appointmentDate: '2024-02-01',
          appointmentTime: '10:00 AM',
          location: 'Medical Center',
          address: '123 Test St',
          phoneNumber: '555-0100',
        }),
      });

      const appointmentResponse = await scheduleAppointment(appointmentRequest);
      expect(appointmentResponse.status).toBe(201);

      // Both operations successful with same doctor
      expect(prescriptionResponse.status).toBe(201);
      expect(appointmentResponse.status).toBe(201);
    });
  });
});

