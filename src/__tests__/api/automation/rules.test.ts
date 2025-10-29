import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/automation/rules/route';

// Mock authentication
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' }
  })
}));

// Mock the automation engine
jest.mock('@/lib/services/automation-engine', () => ({
  automationEngine: {
    getUserRules: jest.fn().mockReturnValue([
      {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test automation rule',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: true,
        executionCount: 5,
        lastExecuted: '2024-01-01T10:00:00Z',
        createdAt: '2024-01-01T09:00:00Z'
      }
    ]),
    addRule: jest.fn().mockResolvedValue('new-rule-id')
  }
}));

describe('/api/automation/rules', () => {
  describe('GET', () => {
    it('should return automation rules for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/automation/rules');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.rules)).toBe(true);
      expect(data.rules).toHaveLength(1);
      expect(data.rules[0].name).toBe('Test Rule');
      expect(data.count).toBe(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/automation/rules');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('should create a new automation rule', async () => {
      const ruleData = {
        name: 'New Rule',
        description: 'New automation rule',
        trigger: {
          type: 'email',
          conditions: { patterns: ['test'] }
        },
        actions: [{
          type: 'send_email',
          config: { to: 'test@example.com', subject: 'Test' }
        }],
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/automation/rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.ruleId).toBe('new-rule-id');
      expect(data.message).toBe('Automation rule created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'Incomplete Rule'
        // Missing trigger and actions
      };

      const request = new NextRequest('http://localhost:3000/api/automation/rules', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: name, trigger, actions');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const ruleData = {
        name: 'New Rule',
        trigger: { type: 'schedule', conditions: {} },
        actions: []
      };

      const request = new NextRequest('http://localhost:3000/api/automation/rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle server errors gracefully', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');
      automationEngine.addRule.mockRejectedValueOnce(new Error('Database error'));

      const ruleData = {
        name: 'New Rule',
        trigger: { type: 'schedule', conditions: {} },
        actions: []
      };

      const request = new NextRequest('http://localhost:3000/api/automation/rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create automation rule');
    });
  });
});
