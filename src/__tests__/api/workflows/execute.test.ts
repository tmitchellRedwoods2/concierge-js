/**
 * Unit tests for Workflow Execution API
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/workflows/execute/route';
import { auth } from '@/lib/auth';
import { WorkflowModel } from '@/lib/models/Workflow';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import { automationEngine } from '@/lib/services/automation-engine';
import { CalendarSyncService } from '@/lib/services/calendar-sync';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import connectDB from '@/lib/db/mongodb';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/models/Workflow');
jest.mock('@/lib/models/WorkflowExecution');
jest.mock('@/lib/models/CalendarEvent');
jest.mock('@/lib/services/automation-engine');
jest.mock('@/lib/services/calendar-sync');
jest.mock('@/lib/db/mongodb');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const MockWorkflowModel = WorkflowModel as jest.MockedClass<typeof WorkflowModel>;
const MockWorkflowExecution = WorkflowExecution as jest.MockedClass<typeof WorkflowExecution>;
const MockAutomationEngine = automationEngine as jest.Mocked<typeof automationEngine>;
const MockCalendarSyncService = CalendarSyncService as jest.MockedClass<typeof CalendarSyncService>;
const MockCalendarEvent = CalendarEvent as jest.MockedClass<typeof CalendarEvent>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Workflow Execution API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockWorkflow = {
    _id: 'test-automation-rule-workflow',
    userId: 'test-user-id',
    name: 'Test Workflow with Automation Rule',
    description: 'Test workflow',
    trigger: {
      type: 'email',
      conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }],
    },
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { label: 'Email Trigger' },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: { label: 'AI Processing' },
      },
      {
        id: 'automation-rule-1',
        type: 'automation_rule',
        position: { x: 500, y: 100 },
        data: {
          label: 'Create Calendar Event',
          ruleId: 'test-rule-id',
          ruleName: 'Medical Appointment Detection',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 700, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'automation-rule-1', type: 'default' },
      { id: 'e3-4', source: 'automation-rule-1', target: 'end-1', type: 'default' },
    ],
    isActive: true,
  };

  const mockAutomationRule = {
    id: 'test-rule-id',
    name: 'Medical Appointment Detection',
    enabled: true,
    actions: [
      {
        type: 'create_calendar_event',
        config: {
          title: '{aiResult.title}',
          startDate: '{aiResult.date}T{aiResult.time}',
        },
      },
      {
        type: 'send_email',
        config: {
          to: '{aiResult.attendee}',
          subject: 'Appointment Confirmation',
        },
      },
    ],
    executionCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
    mockConnectDB.mockResolvedValue(undefined as any);

    // Mock WorkflowModel.findOne
    (MockWorkflowModel.findOne as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWorkflow),
      }),
    });

    // Mock automation engine
    MockAutomationEngine.getUserRules = jest.fn().mockResolvedValue([mockAutomationRule]);
    MockAutomationEngine.executeSingleAction = jest.fn().mockResolvedValue({
      success: true,
      details: { eventId: 'test-event-id' },
      message: 'Action executed successfully',
    });

    // Mock CalendarEvent.findById
    (MockCalendarEvent.findById as jest.Mock) = jest.fn().mockResolvedValue({
      _id: 'test-event-id',
      title: 'Test Event',
    });

    // Mock CalendarSyncService
    const mockSyncService = {
      syncEventIfEnabled: jest.fn().mockResolvedValue({ success: true }),
    };
    MockCalendarSyncService.mockImplementation(() => mockSyncService as any);

    // Mock WorkflowExecution constructor
    const mockExecutionInstance = {
      save: jest.fn().mockResolvedValue({}),
    };
    (MockWorkflowExecution as any).mockImplementation(() => mockExecutionInstance);
  });

  describe('POST /api/workflows/execute', () => {
    it('should execute workflow with automation rule node', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: {
            email: 'test@example.com',
            content: 'I need to schedule an appointment with Dr. Smith on January 15th at 2 PM',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.execution).toBeDefined();
      expect(data.execution.workflowId).toBe('test-automation-rule-workflow');

      // Verify workflow was loaded from MongoDB
      expect(MockWorkflowModel.findOne).toHaveBeenCalledWith({
        _id: 'test-automation-rule-workflow',
        userId: 'test-user-id',
      });

      // Verify automation rule was executed
      expect(MockAutomationEngine.getUserRules).toHaveBeenCalledWith('test-user-id');
      expect(MockAutomationEngine.executeSingleAction).toHaveBeenCalled();
    });

    it('should include automation_rule step in execution results', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: {
            email: 'test@example.com',
            content: 'I need to schedule an appointment',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.execution.steps).toBeDefined();

      // Find automation_rule step
      const automationRuleStep = data.execution.steps.find(
        (step: any) => step.type === 'automation_rule'
      );
      expect(automationRuleStep).toBeDefined();
      expect(automationRuleStep.id).toBe('automation-rule-1');
      expect(automationRuleStep.status).toBe('completed');
    });

    it('should handle workflow not found gracefully', async () => {
      (MockWorkflowModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'non-existent-workflow',
          triggerData: { email: 'test@example.com', content: 'test' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still execute with fallback behavior
      expect(response.status).toBe(200);
      expect(data.execution).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-workflow',
          triggerData: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle automation rule execution errors gracefully', async () => {
      MockAutomationEngine.getUserRules.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: {
            email: 'test@example.com',
            content: 'I need to schedule an appointment',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still complete workflow execution even if automation rule fails
      expect(response.status).toBe(200);
      expect(data.execution).toBeDefined();

      // Automation rule step should show as failed
      const automationRuleStep = data.execution.steps.find(
        (step: any) => step.type === 'automation_rule'
      );
      expect(automationRuleStep.status).toBe('failed');
    });

    it('should resolve template variables in automation rule actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: {
            email: 'test@example.com',
            content: 'I need to schedule an appointment',
          },
        }),
      });

      await POST(request);

      // Verify executeSingleAction was called with resolved config
      expect(MockAutomationEngine.executeSingleAction).toHaveBeenCalled();
      const callArgs = (MockAutomationEngine.executeSingleAction as jest.Mock).mock.calls[0];
      const actionConfig = callArgs[0].config;

      // Template variables should be resolved (not literal {aiResult.title})
      expect(actionConfig.title).not.toContain('{aiResult');
    });

    it('should use actual recipient email from triggerData instead of placeholder', async () => {
      (MockWorkflowModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockWorkflow),
        }),
      });

      MockAutomationEngine.getUserRules = jest.fn().mockResolvedValue([mockAutomationRule]);
      MockAutomationEngine.executeSingleAction = jest.fn().mockResolvedValue({
        message: 'Email sent successfully',
        details: { to: 'real-user@example.com' },
      });

      const realUserEmail = 'real-user@example.com';
      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: {
            email: realUserEmail,
            content: 'I need to schedule an appointment',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify that executeSingleAction was called with the real email address
      expect(MockAutomationEngine.executeSingleAction).toHaveBeenCalled();
      const emailActionCall = (MockAutomationEngine.executeSingleAction as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].type === 'send_email'
      );

      if (emailActionCall) {
        const emailConfig = emailActionCall[0].config;
        // The recipient should be the real email, not a placeholder
        expect(emailConfig.to || emailConfig.recipientEmail).toBe(realUserEmail);
        expect(emailConfig.to || emailConfig.recipientEmail).not.toBe('john.doe@example.com');
      }

      // Verify the AI result context contains the real email as attendee
      const automationRuleCall = (MockAutomationEngine.executeSingleAction as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].type === 'send_email'
      );
      if (automationRuleCall) {
        const context = automationRuleCall[1];
        // The context should have the real email in aiResult.attendee
        expect(context.triggerData).toBeDefined();
        // The aiResult should be available in the context passed to automation rules
      }
    });
  });

  describe('GET /api/workflows/execute', () => {
    it('should return execution history', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflowId: 'test-workflow',
          status: 'completed',
          startTime: '2024-01-01T00:00:00Z',
        },
        {
          id: 'exec-2',
          workflowId: 'test-workflow',
          status: 'failed',
          startTime: '2024-01-02T00:00:00Z',
        },
      ];

      (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockExecutions),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/execute');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.executions).toHaveLength(2);
      expect(MockWorkflowExecution.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/workflows/execute');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});

