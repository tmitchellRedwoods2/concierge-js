/**
 * Integration Tests - Workflow with Automation Rule
 * Tests the complete flow: Workflow execution -> Automation rule node -> Calendar event creation
 */
import { NextRequest } from 'next/server';
import { POST as executeWorkflow } from '@/app/api/workflows/execute/route';
import { GET as getWorkflows } from '@/app/api/workflows/route';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import { AutomationRule } from '@/lib/models/AutomationRule';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { automationEngine } from '@/lib/services/automation-engine';
import { CalendarSyncService } from '@/lib/services/calendar-sync';

jest.mock('@/lib/auth');
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/models/Workflow');
jest.mock('@/lib/models/WorkflowExecution');
jest.mock('@/lib/models/AutomationRule');
jest.mock('@/lib/models/CalendarEvent');
jest.mock('@/lib/services/automation-engine');
jest.mock('@/lib/services/calendar-sync');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockWorkflowModel = WorkflowModel as jest.MockedClass<typeof WorkflowModel>;
const MockWorkflowExecution = WorkflowExecution as jest.MockedClass<typeof WorkflowExecution>;
const MockAutomationRule = AutomationRule as jest.MockedClass<typeof AutomationRule>;
const MockCalendarEvent = CalendarEvent as jest.MockedClass<typeof CalendarEvent>;
const MockAutomationEngine = automationEngine as jest.Mocked<typeof automationEngine>;
const MockCalendarSyncService = CalendarSyncService as jest.MockedClass<typeof CalendarSyncService>;

describe('Workflow with Automation Rule Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'integration-user-123',
      name: 'Integration Test User',
      email: 'test@example.com',
    },
  };

  const mockWorkflow = {
    _id: 'test-automation-rule-workflow',
    userId: 'integration-user-123',
    name: 'Test Workflow with Automation Rule',
    description: 'Test workflow that uses an automation rule',
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
          ruleId: 'medical-appointment-rule',
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
    _id: 'medical-appointment-rule',
    userId: 'integration-user-123',
    name: 'Medical Appointment Detection',
    enabled: true,
    actions: [
      {
        type: 'create_calendar_event',
        config: {
          title: '{aiResult.title}',
          description: 'Appointment scheduled via workflow',
          startDate: '{aiResult.date}T{aiResult.time}',
          endDate: '{aiResult.date}T{aiResult.time}',
          location: '{aiResult.location}',
          attendees: ['{aiResult.attendee}'],
        },
      },
      {
        type: 'send_email',
        config: {
          to: '{aiResult.attendee}',
          subject: 'Appointment Confirmation: {aiResult.title}',
          template: 'appointment_confirmation',
        },
      },
    ],
    executionCount: 0,
  };

  const mockCalendarEvent = {
    _id: 'test-calendar-event-id',
    userId: 'integration-user-123',
    title: 'AI Scheduled Appointment',
    startDate: new Date('2024-01-15T14:00:00Z'),
    endDate: new Date('2024-01-15T15:00:00Z'),
    location: 'Conference Room A',
    attendees: ['john.doe@example.com'],
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

    // Mock AutomationRule.findById
    (MockAutomationRule.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockAutomationRule),
    });

    // Mock automation engine
    MockAutomationEngine.getUserRules = jest.fn().mockResolvedValue([mockAutomationRule]);
    MockAutomationEngine.executeSingleAction = jest.fn().mockResolvedValue({
      success: true,
      details: { eventId: 'test-calendar-event-id' },
      message: 'Action executed successfully',
    });

    // Mock CalendarEvent.findById
    (MockCalendarEvent.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCalendarEvent);

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

  describe('Complete Workflow with Automation Rule Flow', () => {
    it('should execute workflow with automation rule node and create calendar event', async () => {
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

      const response = await executeWorkflow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.execution).toBeDefined();
      expect(data.execution.workflowId).toBe('test-automation-rule-workflow');
      expect(data.execution.status).toBe('completed');

      // Verify workflow was loaded from MongoDB
      expect(MockWorkflowModel.findOne).toHaveBeenCalledWith({
        _id: 'test-automation-rule-workflow',
        userId: 'integration-user-123',
      });

      // Verify automation rule was retrieved and executed
      expect(MockAutomationEngine.getUserRules).toHaveBeenCalledWith('integration-user-123');
      expect(MockAutomationEngine.executeSingleAction).toHaveBeenCalled();

      // Verify execution was saved
      expect(MockWorkflowExecution).toHaveBeenCalled();
    });

    it('should include automation_rule step in execution steps', async () => {
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

      const response = await executeWorkflow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.execution.steps).toBeDefined();

      // Verify all expected step types are present
      const stepTypes = data.execution.steps.map((step: any) => step.type);
      expect(stepTypes).toContain('trigger');
      expect(stepTypes).toContain('ai');
      expect(stepTypes).toContain('automation_rule');
      expect(stepTypes).toContain('end');

      // Verify automation_rule step details
      const automationRuleStep = data.execution.steps.find(
        (step: any) => step.type === 'automation_rule'
      );
      expect(automationRuleStep).toBeDefined();
      expect(automationRuleStep.id).toBe('automation-rule-1');
      expect(automationRuleStep.status).toBe('completed');
      expect(automationRuleStep.result).toBeDefined();
      expect(automationRuleStep.result.success).toBe(true);
    });

    it('should resolve template variables from AI result in automation rule actions', async () => {
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

      await executeWorkflow(request);

      // Verify executeSingleAction was called with resolved template variables
      expect(MockAutomationEngine.executeSingleAction).toHaveBeenCalled();
      const calls = (MockAutomationEngine.executeSingleAction as jest.Mock).mock.calls;

      // Find the create_calendar_event call
      const calendarEventCall = calls.find(
        (call: any[]) => call[0].type === 'create_calendar_event'
      );
      expect(calendarEventCall).toBeDefined();

      const actionConfig = calendarEventCall[0].config;
      // Template variables should be resolved, not literal strings
      expect(actionConfig.title).toBe('AI Scheduled Appointment');
      expect(actionConfig.startDate).toContain('2024-01-15');
      expect(actionConfig.location).toBe('Conference Room A');
    });

    it('should update automation rule execution count after successful execution', async () => {
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

      await executeWorkflow(request);

      // Verify automation rule execution count was updated
      expect(MockAutomationRule.findByIdAndUpdate).toHaveBeenCalledWith(
        'medical-appointment-rule',
        expect.objectContaining({
          executionCount: 1,
          lastExecuted: expect.any(Date),
        })
      );
    });

    it('should handle disabled automation rule gracefully', async () => {
      const disabledRule = { ...mockAutomationRule, enabled: false };
      MockAutomationEngine.getUserRules.mockResolvedValueOnce([disabledRule]);

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

      const response = await executeWorkflow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Automation rule step should show as skipped
      const automationRuleStep = data.execution.steps.find(
        (step: any) => step.type === 'automation_rule'
      );
      expect(automationRuleStep.result.skipped).toBe(true);
    });

    it('should handle missing automation rule gracefully', async () => {
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

      const response = await executeWorkflow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Automation rule step should show as failed
      const automationRuleStep = data.execution.steps.find(
        (step: any) => step.type === 'automation_rule'
      );
      expect(automationRuleStep.status).toBe('failed');
      expect(automationRuleStep.result.error).toContain('not found');
    });
  });

  describe('Error Handling in Workflow Execution', () => {
    it('should handle database connection errors', async () => {
      mockConnectDB.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: { email: 'test@example.com', content: 'test' },
        }),
      });

      const response = await executeWorkflow(request);
      
      // Should handle error gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle authentication failure', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'test-automation-rule-workflow',
          triggerData: { email: 'test@example.com', content: 'test' },
        }),
      });

      const response = await executeWorkflow(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});


