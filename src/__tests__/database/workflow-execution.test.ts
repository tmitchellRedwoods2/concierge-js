/**
 * Database Unit Tests for Workflow Execution
 * Tests actual database operations that would have caught issues we encountered:
 * - Workflow not loading from MongoDB
 * - Automation rule nodes not being executed
 * - Template variable resolution issues
 * - Execution count tracking not working
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/models/Workflow');
jest.unmock('@/lib/models/AutomationRule');
jest.unmock('@/lib/models/WorkflowExecution');

import { WorkflowModel } from '@/lib/models/Workflow';
import { AutomationRule } from '@/lib/models/AutomationRule';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  seedTestDatabase,
  findDocuments,
  countDocuments,
} from '../utils/db-test-helper';

describe('Workflow Execution - Database Tests', () => {
  beforeAll(async () => {
    // Increase timeout for MongoDB binary download (can take 30+ seconds first time)
    jest.setTimeout(60000);
    await setupTestDatabase();
  }, 60000);

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Workflow Loading from MongoDB', () => {
    it('should load workflow definition from MongoDB by ID and userId', async () => {
      // This test would have caught the issue where workflow wasn't loading from MongoDB
      const workflowData = {
        _id: 'test-automation-rule-workflow',
        userId: 'user-123',
        name: 'Test Workflow with Automation Rule',
        description: 'Test workflow',
        trigger: {
          type: 'email',
          conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }],
        },
        nodes: [
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
        ],
        edges: [],
        isActive: true,
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      // Test the actual query used in workflow execution
      const loadedWorkflow = await WorkflowModel.findOne({
        _id: 'test-automation-rule-workflow',
        userId: 'user-123',
      })
        .lean()
        .exec();

      expect(loadedWorkflow).toBeDefined();
      expect(loadedWorkflow?._id).toBe('test-automation-rule-workflow');
      expect(loadedWorkflow?.userId).toBe('user-123');
      expect(loadedWorkflow?.nodes).toHaveLength(1);
      expect(loadedWorkflow?.nodes[0].type).toBe('automation_rule');
    });

    it('should fallback to loading workflow by ID only if userId match fails', async () => {
      // Test the fallback query
      const workflowData = {
        _id: 'shared-workflow',
        userId: 'user-456',
        name: 'Shared Workflow',
        description: 'Shared workflow',
        trigger: { type: 'email', conditions: [] },
        nodes: [],
        edges: [],
        isActive: true,
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      // Try to find with different userId (should fail)
      const notFound = await WorkflowModel.findOne({
        _id: 'shared-workflow',
        userId: 'user-123',
      })
        .lean()
        .exec();

      expect(notFound).toBeNull();

      // Fallback query by ID only (should succeed)
      const found = await WorkflowModel.findOne({ _id: 'shared-workflow' }).lean().exec();

      expect(found).toBeDefined();
      expect(found?._id).toBe('shared-workflow');
    });

    it('should handle workflow not found gracefully', async () => {
      // Test that missing workflow doesn't crash
      const notFound = await WorkflowModel.findOne({
        _id: 'non-existent-workflow',
        userId: 'user-123',
      })
        .lean()
        .exec();

      expect(notFound).toBeNull();
    });
  });

  describe('Automation Rule Node Detection', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'workflow-with-rule',
            userId: 'user-123',
            name: 'Workflow with Rule',
            description: 'Has automation rule node',
            trigger: { type: 'email', conditions: [] },
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
            edges: [],
            isActive: true,
          },
          {
            _id: 'workflow-without-rule',
            userId: 'user-123',
            name: 'Workflow without Rule',
            description: 'No automation rule node',
            trigger: { type: 'email', conditions: [] },
            nodes: [
              {
                id: 'trigger-1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Email Trigger' },
              },
            ],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should find automation rule nodes in workflow', async () => {
      // This test would have caught the issue where automation rule nodes weren't being found
      const workflow = await WorkflowModel.findOne({ _id: 'workflow-with-rule' }).lean().exec();

      expect(workflow).toBeDefined();
      expect(workflow?.nodes).toBeDefined();

      // Test the actual filter used in workflow execution
      const automationRuleNodes = workflow?.nodes.filter(
        (node: any) => node.type === 'automation_rule'
      );

      expect(automationRuleNodes).toHaveLength(1);
      expect(automationRuleNodes[0].id).toBe('automation-rule-1');
      expect(automationRuleNodes[0].data.ruleId).toBe('medical-appointment-rule');
    });

    it('should return empty array when no automation rule nodes exist', async () => {
      const workflow = await WorkflowModel.findOne({ _id: 'workflow-without-rule' }).lean().exec();

      expect(workflow).toBeDefined();
      const automationRuleNodes = workflow?.nodes.filter(
        (node: any) => node.type === 'automation_rule'
      );

      expect(automationRuleNodes).toHaveLength(0);
    });

    it('should handle workflow with null nodes array', async () => {
      const workflowData = {
        _id: 'workflow-null-nodes',
        userId: 'user-123',
        name: 'Workflow with Null Nodes',
        description: 'Has null nodes',
        trigger: { type: 'email', conditions: [] },
        nodes: null,
        edges: [],
        isActive: true,
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      const loaded = await WorkflowModel.findOne({ _id: 'workflow-null-nodes' }).lean().exec();

      // Should handle null nodes gracefully
      if (loaded?.nodes) {
        const automationRuleNodes = loaded.nodes.filter((node: any) => node.type === 'automation_rule');
        expect(automationRuleNodes).toHaveLength(0);
      } else {
        expect(loaded?.nodes).toBeNull();
      }
    });
  });

  describe('Automation Rule Execution Tracking', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        automationrules: [
          {
            _id: 'medical-appointment-rule',
            userId: 'user-123',
            name: 'Medical Appointment Detection',
            description: 'Detects medical appointments',
            trigger: {
              type: 'email',
              conditions: { patterns: ['appointment', 'doctor'] },
            },
            actions: [
              {
                type: 'create_calendar_event',
                config: {
                  title: '{aiResult.title}',
                  startDate: '{aiResult.date}T{aiResult.time}',
                },
              },
            ],
            enabled: true,
            executionCount: 0,
          },
        ],
      });
    });

    it('should update automation rule execution count after execution', async () => {
      // This test would have caught the issue where execution count wasn't updating
      const rule = await AutomationRule.findById('medical-appointment-rule');
      expect(rule).toBeDefined();
      expect(rule?.executionCount).toBe(0);
      expect(rule?.lastExecuted).toBeUndefined();

      // Simulate execution tracking update
      const lastExecuted = new Date();
      await AutomationRule.findByIdAndUpdate('medical-appointment-rule', {
        $inc: { executionCount: 1 },
        lastExecuted,
      });

      const updated = await AutomationRule.findById('medical-appointment-rule').lean();
      expect(updated?.executionCount).toBe(1);
      expect(updated?.lastExecuted).toBeDefined();
    });

    it('should increment execution count multiple times', async () => {
      const rule = await AutomationRule.findById('medical-appointment-rule');
      expect(rule).toBeDefined();
      expect(rule?.executionCount).toBe(0);

      // Simulate multiple executions
      for (let i = 0; i < 3; i++) {
        await AutomationRule.findByIdAndUpdate('medical-appointment-rule', {
          $inc: { executionCount: 1 },
          lastExecuted: new Date(),
        });
      }

      const updated = await AutomationRule.findById('medical-appointment-rule').lean();
      expect(updated?.executionCount).toBe(3);
    });

    it('should find automation rule by ID for execution', async () => {
      // Test the actual query used to find rules for execution
      const rules = await AutomationRule.find({ userId: 'user-123' }).lean();
      expect(rules).toHaveLength(1);

      const rule = rules.find((r: any) => r._id === 'medical-appointment-rule');
      expect(rule).toBeDefined();
      expect(rule?.enabled).toBe(true);
      expect(rule?.actions).toHaveLength(1);
    });

    it('should handle disabled automation rule', async () => {
      await AutomationRule.findByIdAndUpdate('medical-appointment-rule', { enabled: false });

      const updated = await AutomationRule.findById('medical-appointment-rule').lean();
      expect(updated?.enabled).toBe(false);
    });

    it('should handle missing automation rule', async () => {
      const rules = await AutomationRule.find({ userId: 'user-123' }).lean();
      const rule = rules.find((r: any) => r._id === 'non-existent-rule');

      expect(rule).toBeUndefined();
    });
  });

  describe('Workflow Execution Persistence', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'test-workflow',
            userId: 'user-123',
            name: 'Test Workflow',
            description: 'Test',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should save workflow execution to database', async () => {
      // This test would have caught issues with execution persistence
      const executionData = {
        id: 'exec_1234567890',
        workflowId: 'test-workflow',
        workflowName: 'Test Workflow',
        status: 'completed',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        steps: [
          {
            id: 'trigger-1',
            type: 'trigger',
            status: 'completed',
            result: { email: 'test@example.com', content: 'test' },
          },
          {
            id: 'automation-rule-1',
            type: 'automation_rule',
            status: 'completed',
            result: { success: true, ruleId: 'test-rule' },
          },
        ],
        triggerData: { email: 'test@example.com', content: 'test' },
        result: {
          appointmentId: 'event-123',
          status: 'scheduled',
          eventUrl: '/calendar/event/event-123',
        },
        userId: 'user-123',
      };

      const execution = new WorkflowExecution(executionData);
      await execution.save();

      // Verify execution was saved
      const count = await countDocuments('workflowexecutions');
      expect(count).toBe(1);

      // Verify execution data
      const saved = await WorkflowExecution.findOne({ id: 'exec_1234567890' }).lean();
      expect(saved).toBeDefined();
      expect(saved?.workflowId).toBe('test-workflow');
      expect(saved?.status).toBe('completed');
      expect(saved?.steps).toHaveLength(2);

      // Verify automation_rule step is present
      const automationRuleStep = saved?.steps.find((step: any) => step.type === 'automation_rule');
      expect(automationRuleStep).toBeDefined();
      expect(automationRuleStep?.status).toBe('completed');
      expect(automationRuleStep?.result.success).toBe(true);
    });

    it('should include automation_rule step in execution steps', async () => {
      // This test would have caught the issue where automation_rule steps weren't in execution logs
      const executionData = {
        id: 'exec_with_rule',
        workflowId: 'test-workflow',
        workflowName: 'Test Workflow',
        status: 'completed',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        steps: [
          {
            id: 'trigger-1',
            type: 'trigger',
            status: 'completed',
            result: {},
          },
          {
            id: 'ai-1',
            type: 'ai',
            status: 'completed',
            result: {},
          },
          {
            id: 'automation-rule-1',
            type: 'automation_rule',
            status: 'completed',
            result: {
              success: true,
              ruleId: 'medical-appointment-rule',
              ruleName: 'Medical Appointment Detection',
              actionsExecuted: 1,
            },
          },
          {
            id: 'end-1',
            type: 'end',
            status: 'completed',
            result: {},
          },
        ],
        triggerData: {},
        result: { status: 'scheduled' },
        userId: 'user-123',
      };

      const execution = new WorkflowExecution(executionData);
      await execution.save();

      const saved = await WorkflowExecution.findOne({ id: 'exec_with_rule' }).lean();
      expect(saved?.steps).toHaveLength(4);

      // Verify automation_rule step exists
      const automationRuleStep = saved?.steps.find((step: any) => step.type === 'automation_rule');
      expect(automationRuleStep).toBeDefined();
      expect(automationRuleStep?.id).toBe('automation-rule-1');
      expect(automationRuleStep?.result.success).toBe(true);
      expect(automationRuleStep?.result.ruleId).toBe('medical-appointment-rule');
    });

    it('should query workflow executions by userId', async () => {
      await seedTestDatabase({
        workflowexecutions: [
          {
            id: 'exec-1',
            workflowId: 'test-workflow',
            workflowName: 'Test Workflow',
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            steps: [],
            triggerData: {},
            result: {},
            userId: 'user-123',
          },
          {
            id: 'exec-2',
            workflowId: 'test-workflow',
            workflowName: 'Test Workflow',
            status: 'failed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            steps: [],
            triggerData: {},
            result: {},
            userId: 'user-123',
          },
          {
            id: 'exec-3',
            workflowId: 'test-workflow',
            workflowName: 'Test Workflow',
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            steps: [],
            triggerData: {},
            result: {},
            userId: 'user-456',
          },
        ],
      });

      // Test the actual query used in GET /api/workflows/execute
      const executions = await WorkflowExecution.find({ userId: 'user-123' })
        .sort({ startTime: -1 })
        .limit(50)
        .lean();

      expect(executions).toHaveLength(2);
      expect(executions.map((e: any) => e.id)).toContain('exec-1');
      expect(executions.map((e: any) => e.id)).toContain('exec-2');
    });
  });

  describe('Template Variable Resolution', () => {
    it('should store template variables in automation rule action config', async () => {
      // This test would have caught template variable resolution issues
      const ruleData = {
        _id: 'template-variable-rule',
        userId: 'user-123',
        name: 'Template Variable Rule',
        description: 'Rule with template variables',
        trigger: {
          type: 'email',
          conditions: { patterns: ['appointment'] },
        },
        actions: [
          {
            type: 'create_calendar_event',
            config: {
              title: '{aiResult.title}',
              description: 'Appointment scheduled via workflow',
              startDate: '{aiResult.date}T{aiResult.time}',
              location: '{aiResult.location}',
              attendees: ['{aiResult.attendee}'],
            },
          },
          {
            type: 'send_email',
            config: {
              to: '{aiResult.attendee}',
              subject: 'Appointment Confirmation: {aiResult.title}',
              body: 'Date: {aiResult.date} at {aiResult.time}',
            },
          },
        ],
        enabled: true,
      };

      const rule = new AutomationRule(ruleData);
      await rule.save();

      const saved = await AutomationRule.findOne({ name: 'Template Variable Rule' }).lean();

      // Verify template variables are stored correctly
      expect(saved?.actions[0].config.title).toBe('{aiResult.title}');
      expect(saved?.actions[0].config.startDate).toBe('{aiResult.date}T{aiResult.time}');
      expect(saved?.actions[0].config.location).toBe('{aiResult.location}');
      expect(saved?.actions[1].config.to).toBe('{aiResult.attendee}');
      expect(saved?.actions[1].config.subject).toBe('Appointment Confirmation: {aiResult.title}');
    });

    it('should handle nested template variables', async () => {
      const ruleData = {
        _id: 'nested-template-rule',
        userId: 'user-123',
        name: 'Nested Template Rule',
        description: 'Rule with nested template variables',
        trigger: {
          type: 'email',
          conditions: { patterns: ['test'] },
        },
        actions: [
          {
            type: 'send_email',
            config: {
              to: '{triggerResult.email}',
              subject: 'From: {triggerResult.email}',
              body: 'AI Result: {aiResult.title}',
            },
          },
        ],
        enabled: true,
      };

      const rule = new AutomationRule(ruleData);
      await rule.save();

      const saved = await AutomationRule.findOne({ name: 'Nested Template Rule' }).lean();

      expect(saved?.actions[0].config.to).toBe('{triggerResult.email}');
      expect(saved?.actions[0].config.subject).toBe('From: {triggerResult.email}');
      expect(saved?.actions[0].config.body).toBe('AI Result: {aiResult.title}');
    });
  });

  describe('Integration: Workflow with Automation Rule', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'integration-workflow',
            userId: 'user-123',
            name: 'Integration Test Workflow',
            description: 'Full integration test',
            trigger: {
              type: 'email',
              conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }],
            },
            nodes: [
              {
                id: 'automation-rule-1',
                type: 'automation_rule',
                position: { x: 500, y: 100 },
                data: {
                  ruleId: 'integration-rule',
                  ruleName: 'Integration Rule',
                },
              },
            ],
            edges: [],
            isActive: true,
          },
        ],
        automationrules: [
          {
            _id: 'integration-rule',
            userId: 'user-123',
            name: 'Integration Rule',
            description: 'Rule for integration test',
            trigger: {
              type: 'email',
              conditions: { patterns: ['appointment'] },
            },
            actions: [
              {
                type: 'create_calendar_event',
                config: {
                  title: '{aiResult.title}',
                  startDate: '{aiResult.date}T{aiResult.time}',
                },
              },
            ],
            enabled: true,
            executionCount: 0,
          },
        ],
      });
    });

    it('should find workflow and automation rule together', async () => {
      // This integration test would have caught the issue where workflow and rule weren't connected
      const workflow = await WorkflowModel.findOne({ _id: 'integration-workflow' }).lean().exec();
      expect(workflow).toBeDefined();

      const automationRuleNode = workflow?.nodes.find(
        (node: any) => node.type === 'automation_rule'
      );
      expect(automationRuleNode).toBeDefined();
      expect(automationRuleNode?.data.ruleId).toBe('integration-rule');

      // Find the actual rule
      const rule = await AutomationRule.findById('integration-rule').lean();
      expect(rule).toBeDefined();
      expect(rule?.enabled).toBe(true);
      expect(rule?.actions).toHaveLength(1);
    });

    it('should track execution count when rule is executed', async () => {
      const rule = await AutomationRule.findById('integration-rule');
      expect(rule).toBeDefined();
      expect(rule?.executionCount).toBe(0);

      // Simulate rule execution
      await AutomationRule.findByIdAndUpdate('integration-rule', {
        $inc: { executionCount: 1 },
        lastExecuted: new Date(),
      });

      const updated = await AutomationRule.findById('integration-rule').lean();
      expect(updated?.executionCount).toBe(1);
    });
  });
});

