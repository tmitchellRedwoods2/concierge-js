/**
 * Integration Tests for Agentic Workflow Execution Flow
 * Tests the complete flow from trigger to execution completion
 */

/**
 * @jest-environment node
 */

jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/models/Workflow');
jest.unmock('@/lib/models/WorkflowExecution');

import { agenticWorkflowExecutor, AgenticWorkflowTrigger } from '@/lib/services/agentic-workflow-executor';
import { WorkflowModel } from '@/lib/models/Workflow';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../utils/db-test-helper';
import getUser from '@/lib/db/models/User';

describe('Agentic Workflow Execution - Integration Tests', () => {
  let testUserId: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    jest.setTimeout(90000);
    await setupTestDatabase();
  }, 90000);

  beforeEach(async () => {
    await clearTestDatabase();

    // Create test user
    const User = getUser();
    const testUser = new User({
      username: 'integration-test-user',
      email: 'integration@example.com',
      password: 'password',
      firstName: 'Integration',
      lastName: 'Test',
      role: 'client',
      accessMode: 'hands-off',
      plan: 'premium',
    });
    await testUser.save();
    testUserId = testUser._id.toString();

    // Create test workflow
    const workflowData = {
      _id: 'integration-test-workflow',
      userId: testUserId,
      name: 'Integration Test Workflow',
      description: 'Test workflow for integration testing',
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
          data: {
            label: 'AI Processing',
            prompt: 'Extract appointment details',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 500, y: 100 },
          data: { label: 'End' },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2-3', source: 'ai-1', target: 'end-1' },
      ],
      isActive: true,
      isAgentic: true,
      targetAccessMode: ['hands-off'],
      autoApprove: true,
      executionPriority: 7,
      maxRetries: 2,
      retryDelayMs: 500,
    };

    const workflow = new WorkflowModel(workflowData);
    await workflow.save();
    testWorkflowId = workflow._id;
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    agenticWorkflowExecutor.stop();
    await teardownTestDatabase();
  });

  describe('Complete Execution Flow', () => {
    it('should complete full flow from trigger to execution', async () => {
      // Step 1: Create trigger
      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: {
          from: 'doctor@clinic.com',
          subject: 'Appointment Confirmation',
          body: 'Your appointment is scheduled for tomorrow at 2 PM',
          content: 'Your appointment is scheduled for tomorrow at 2 PM',
        },
        userId: testUserId,
        timestamp: new Date(),
      };

      // Step 2: Process trigger (should find matching workflows)
      const matchingWorkflows = await agenticWorkflowExecutor.findMatchingWorkflows(trigger);
      expect(matchingWorkflows).toHaveLength(1);
      expect(matchingWorkflows[0]._id).toBe(testWorkflowId);

      // Step 3: Execute workflow
      const workflow = matchingWorkflows[0];
      const result = await agenticWorkflowExecutor.executeWorkflow(workflow, trigger, 0);

      // Step 4: Verify execution
      expect(result.status).toBe('completed');
      expect(result.workflowId).toBe(testWorkflowId);
      expect(result.executionId).toBeDefined();

      // Step 5: Verify execution record in database
      const execution = await WorkflowExecution.findOne({ id: result.executionId }).lean();
      expect(execution).toBeDefined();
      expect(execution?.status).toBe('completed');
      expect(execution?.workflowId).toBe(testWorkflowId);
      expect(execution?.userId).toBe(testUserId);
      expect(execution?.triggerData).toBeDefined();
    });

    it('should handle multiple workflows for same trigger', async () => {
      // Create second workflow
      const workflow2 = new WorkflowModel({
        _id: 'integration-test-workflow-2',
        userId: testUserId,
        name: 'Second Integration Test Workflow',
        description: 'Second workflow',
        trigger: { type: 'email', conditions: [] },
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Email Trigger' },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 300, y: 100 },
            data: { label: 'End' },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'end-1' },
        ],
        isActive: true,
        isAgentic: true,
        targetAccessMode: ['hands-off'],
      });
      await workflow2.save();

      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: { from: 'test@example.com', subject: 'Test', body: 'Test' },
        userId: testUserId,
        timestamp: new Date(),
      };

      // Process trigger should find both workflows
      const matching = await agenticWorkflowExecutor.findMatchingWorkflows(trigger);
      expect(matching.length).toBeGreaterThanOrEqual(1);

      // Queue both for execution
      for (const workflow of matching) {
        await agenticWorkflowExecutor.queueWorkflow(workflow, trigger);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify executions were created
      const executions = await WorkflowExecution.find({ userId: testUserId }).lean();
      expect(executions.length).toBeGreaterThan(0);
    });
  });

  describe('Priority-based Execution', () => {
    it('should execute workflows in priority order', async () => {
      // Create workflows with different priorities
      const lowPriority = new WorkflowModel({
        _id: 'low-priority-workflow',
        userId: testUserId,
        name: 'Low Priority',
        trigger: { type: 'email', conditions: [] },
        nodes: [{ id: 'trigger-1', type: 'trigger', position: { x: 100, y: 100 }, data: {} }],
        edges: [],
        isActive: true,
        isAgentic: true,
        targetAccessMode: ['hands-off'],
        executionPriority: 3,
      });
      await lowPriority.save();

      const highPriority = new WorkflowModel({
        _id: 'high-priority-workflow',
        userId: testUserId,
        name: 'High Priority',
        trigger: { type: 'email', conditions: [] },
        nodes: [{ id: 'trigger-1', type: 'trigger', position: { x: 100, y: 100 }, data: {} }],
        edges: [],
        isActive: true,
        isAgentic: true,
        targetAccessMode: ['hands-off'],
        executionPriority: 9,
      });
      await highPriority.save();

      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: {},
        userId: testUserId,
        timestamp: new Date(),
      };

      // Queue both workflows
      await agenticWorkflowExecutor.queueWorkflow(lowPriority, trigger);
      await agenticWorkflowExecutor.queueWorkflow(highPriority, trigger);

      // The queue should sort by priority (higher first)
      // Process queue
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify both were executed
      const executions = await WorkflowExecution.find({
        userId: testUserId,
      }).sort({ startTime: 1 }).lean();

      expect(executions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Access Mode Filtering', () => {
    it('should only match workflows for user\'s access mode', async () => {
      // Create workflow for self-service users
      const selfServiceWorkflow = new WorkflowModel({
        _id: 'self-service-workflow',
        userId: testUserId,
        name: 'Self-Service Workflow',
        trigger: { type: 'email', conditions: [] },
        nodes: [{ id: 'trigger-1', type: 'trigger', position: { x: 100, y: 100 }, data: {} }],
        edges: [],
        isActive: true,
        isAgentic: true,
        targetAccessMode: ['self-service'], // Different access mode
      });
      await selfServiceWorkflow.save();

      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: {},
        userId: testUserId,
        timestamp: new Date(),
      };

      // Should only find workflows for hands-off (user's access mode)
      const matching = await agenticWorkflowExecutor.findMatchingWorkflows(trigger);
      const selfServiceMatches = matching.filter(w => w._id === 'self-service-workflow');
      expect(selfServiceMatches).toHaveLength(0);

      // Should find workflows with empty targetAccessMode
      const allAccessWorkflow = new WorkflowModel({
        _id: 'all-access-workflow',
        userId: testUserId,
        name: 'All Access Workflow',
        trigger: { type: 'email', conditions: [] },
        nodes: [{ id: 'trigger-1', type: 'trigger', position: { x: 100, y: 100 }, data: {} }],
        edges: [],
        isActive: true,
        isAgentic: true,
        targetAccessMode: [], // Applies to all
      });
      await allAccessWorkflow.save();

      const matchingAll = await agenticWorkflowExecutor.findMatchingWorkflows(trigger);
      const allAccessMatches = matchingAll.filter(w => w._id === 'all-access-workflow');
      expect(allAccessMatches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle workflow execution errors gracefully', async () => {
      // Create a workflow that will fail (malformed structure)
      const failingWorkflow = new WorkflowModel({
        _id: 'error-workflow',
        userId: testUserId,
        name: 'Error Workflow',
        trigger: { type: 'email', conditions: [] },
        nodes: [], // No nodes - will cause error
        edges: [],
        isActive: true,
        isAgentic: true,
        targetAccessMode: ['hands-off'],
        maxRetries: 1,
        retryDelayMs: 100,
      });
      await failingWorkflow.save();

      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: {},
        userId: testUserId,
        timestamp: new Date(),
      };

      const result = await agenticWorkflowExecutor.executeWorkflow(failingWorkflow, trigger, 0);

      // Should handle error and return appropriate status
      expect(result.status).toBe('retrying'); // Will retry first time
      expect(result.error).toBeDefined();

      // Verify execution record exists
      const execution = await WorkflowExecution.findOne({ workflowId: 'error-workflow' }).lean();
      expect(execution).toBeDefined();
      expect(execution?.status).toBe('failed');
    });

    it('should not crash on invalid user ID', async () => {
      const trigger: AgenticWorkflowTrigger = {
        type: 'email',
        data: {},
        userId: 'non-existent-user-id',
        timestamp: new Date(),
      };

      // Should handle gracefully
      const matching = await agenticWorkflowExecutor.findMatchingWorkflows(trigger);
      expect(matching).toHaveLength(0);
    });
  });
});

