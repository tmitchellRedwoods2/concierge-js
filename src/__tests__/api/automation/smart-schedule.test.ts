import { NextRequest } from 'next/server';
import { POST } from '@/app/api/automation/smart-schedule/route';

// Mock authentication
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' }
  })
}));

// Mock the smart scheduler
jest.mock('@/lib/services/smart-scheduler', () => ({
  smartScheduler: {
    autoScheduleEvent: jest.fn().mockResolvedValue({
      _id: 'test-event-id',
      title: 'Test Meeting',
      startDate: new Date('2024-01-01T10:00:00Z'),
      endDate: new Date('2024-01-01T11:00:00Z'),
      location: 'Conference Room A',
      description: 'Test meeting description'
    })
  }
}));

describe('/api/automation/smart-schedule', () => {
  describe('POST', () => {
    it('should auto-schedule an event successfully', async () => {
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting',
        description: 'Test meeting description',
        location: 'Conference Room A'
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event.id).toBe('test-event-id');
      expect(data.event.title).toBe('Test Meeting');
      expect(data.event.location).toBe('Conference Room A');
      expect(data.message).toBe('Event auto-scheduled successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        title: 'Test Meeting'
        // Missing duration
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: title, duration');
    });

    it('should return 400 when no optimal time found', async () => {
      const { smartScheduler } = require('@/lib/services/smart-scheduler');
      smartScheduler.autoScheduleEvent.mockResolvedValueOnce(null);

      const eventData = {
        title: 'Test Meeting',
        duration: 60
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Unable to find optimal time for scheduling');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const eventData = {
        title: 'Test Meeting',
        duration: 60
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle server errors gracefully', async () => {
      const { smartScheduler } = require('@/lib/services/smart-scheduler');
      smartScheduler.autoScheduleEvent.mockRejectedValueOnce(new Error('Scheduling error'));

      const eventData = {
        title: 'Test Meeting',
        duration: 60
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to auto-schedule event');
    });

    it('should handle different event types', async () => {
      const eventData = {
        title: 'Medical Appointment',
        duration: 30,
        type: 'medical',
        description: 'Annual checkup',
        location: 'Dr. Smith\'s Office'
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event.title).toBe('Test Meeting'); // Mocked response
    });

    it('should handle flexible scheduling', async () => {
      const eventData = {
        title: 'Flexible Meeting',
        duration: 90,
        type: 'meeting',
        flexible: true
      };

      const request = new NextRequest('http://localhost:3000/api/automation/smart-schedule', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
