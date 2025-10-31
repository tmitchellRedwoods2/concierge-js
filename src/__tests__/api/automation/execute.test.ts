import { NextRequest } from 'next/server';
import { POST } from '@/app/api/automation/execute/route';

// Mock authentication
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' }
  })
}));

// Mock the automation engine
jest.mock('@/lib/services/automation-engine', () => ({
  automationEngine: {
    executeRule: jest.fn().mockResolvedValue(true)
  }
}));

describe('/api/automation/execute', () => {
  describe('POST', () => {
    it('should execute a rule successfully', async () => {
      const requestData = {
        ruleId: 'test-rule-id',
        triggerData: { test: 'data' }
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Rule executed successfully');
    });

    it('should execute rule with default trigger data', async () => {
      const requestData = {
        ruleId: 'test-rule-id'
        // No triggerData provided
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing ruleId', async () => {
      const requestData = {
        triggerData: { test: 'data' }
        // Missing ruleId
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: ruleId');
    });

    it('should return 400 when rule execution fails', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');
      automationEngine.executeRule.mockResolvedValueOnce(false);

      const requestData = {
        ruleId: 'test-rule-id'
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to execute rule');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const requestData = {
        ruleId: 'test-rule-id'
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle server errors gracefully', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');
      automationEngine.executeRule.mockRejectedValueOnce(new Error('Execution error'));

      const requestData = {
        ruleId: 'test-rule-id'
      };

      const request = new NextRequest('http://localhost:3000/api/automation/execute', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to execute automation rule');
    });
  });
});
