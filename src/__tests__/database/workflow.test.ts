/**
 * Database Unit Tests for Workflow Model
 * Tests actual database operations using in-memory MongoDB
 */
import { WorkflowModel } from '@/lib/models/Workflow';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  seedTestDatabase,
  findDocuments,
  countDocuments,
  insertDocuments,
} from '../utils/db-test-helper';

describe('Workflow Model - Database Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Create Operations', () => {
    it('should create a workflow in the database', async () => {
      const workflowData = {
        _id: 'test-workflow-1',
        userId: 'user-123',
        name: 'Test Workflow',
        description: 'A test workflow',
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
        ],
        edges: [],
        isActive: true,
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      // Verify workflow was saved
      const count = await countDocuments('workflows');
      expect(count).toBe(1);

      // Verify workflow data
      const savedWorkflow = await WorkflowModel.findById('test-workflow-1').lean();
      expect(savedWorkflow).toBeDefined();
      expect(savedWorkflow?.name).toBe('Test Workflow');
      expect(savedWorkflow?.userId).toBe('user-123');
      expect(savedWorkflow?.isActive).toBe(true);
    });

    it('should create a workflow with automation rule node', async () => {
      const workflowData = {
        _id: 'test-workflow-2',
        userId: 'user-123',
        name: 'Workflow with Automation Rule',
        description: 'A workflow with automation rule node',
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
              ruleId: 'test-rule-id',
              ruleName: 'Medical Appointment Detection',
            },
          },
        ],
        edges: [],
        isActive: true,
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      const savedWorkflow = await WorkflowModel.findById('test-workflow-2').lean();
      expect(savedWorkflow).toBeDefined();
      expect(savedWorkflow?.nodes).toHaveLength(1);
      expect(savedWorkflow?.nodes[0].type).toBe('automation_rule');
      expect(savedWorkflow?.nodes[0].data.ruleId).toBe('test-rule-id');
    });
  });

  describe('Read Operations', () => {
    beforeEach(async () => {
      // Seed test data
      await seedTestDatabase({
        workflows: [
          {
            _id: 'workflow-1',
            userId: 'user-123',
            name: 'Workflow 1',
            description: 'First workflow',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
          {
            _id: 'workflow-2',
            userId: 'user-123',
            name: 'Workflow 2',
            description: 'Second workflow',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: false,
          },
          {
            _id: 'workflow-3',
            userId: 'user-456',
            name: 'Workflow 3',
            description: 'Third workflow',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should find workflow by ID', async () => {
      const workflow = await WorkflowModel.findById('workflow-1').lean();
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Workflow 1');
      expect(workflow?.userId).toBe('user-123');
    });

    it('should find workflows by userId', async () => {
      const workflows = await WorkflowModel.find({ userId: 'user-123' }).lean();
      expect(workflows).toHaveLength(2);
      expect(workflows.map((w) => w._id)).toContain('workflow-1');
      expect(workflows.map((w) => w._id)).toContain('workflow-2');
    });

    it('should find active workflows', async () => {
      const activeWorkflows = await WorkflowModel.find({ isActive: true }).lean();
      expect(activeWorkflows).toHaveLength(2);
      expect(activeWorkflows.map((w) => w._id)).toContain('workflow-1');
      expect(activeWorkflows.map((w) => w._id)).toContain('workflow-3');
    });

    it('should find workflow with automation rule nodes', async () => {
      // Create a workflow with automation rule node
      const workflow = new WorkflowModel({
        _id: 'workflow-with-rule',
        userId: 'user-123',
        name: 'Workflow with Rule',
        description: 'Has automation rule',
        trigger: { type: 'email', conditions: [] },
        nodes: [
          {
            id: 'automation-rule-1',
            type: 'automation_rule',
            position: { x: 500, y: 100 },
            data: { ruleId: 'rule-1', ruleName: 'Test Rule' },
          },
        ],
        edges: [],
        isActive: true,
      });
      await workflow.save();

      const found = await WorkflowModel.findOne({
        'nodes.type': 'automation_rule',
      }).lean();

      expect(found).toBeDefined();
      expect(found?._id).toBe('workflow-with-rule');
      expect(found?.nodes.some((n: any) => n.type === 'automation_rule')).toBe(true);
    });
  });

  describe('Update Operations', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'workflow-update',
            userId: 'user-123',
            name: 'Original Name',
            description: 'Original description',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should update workflow name', async () => {
      await WorkflowModel.findByIdAndUpdate(
        'workflow-update',
        { name: 'Updated Name' },
        { new: true }
      );

      const updated = await WorkflowModel.findById('workflow-update').lean();
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update workflow nodes', async () => {
      const newNodes = [
        {
          id: 'automation-rule-1',
          type: 'automation_rule',
          position: { x: 500, y: 100 },
          data: { ruleId: 'new-rule-id', ruleName: 'New Rule' },
        },
      ];

      await WorkflowModel.findByIdAndUpdate(
        'workflow-update',
        { nodes: newNodes },
        { new: true }
      );

      const updated = await WorkflowModel.findById('workflow-update').lean();
      expect(updated?.nodes).toHaveLength(1);
      expect(updated?.nodes[0].type).toBe('automation_rule');
      expect(updated?.nodes[0].data.ruleId).toBe('new-rule-id');
    });

    it('should toggle workflow active status', async () => {
      const workflow = await WorkflowModel.findById('workflow-update');
      expect(workflow?.isActive).toBe(true);

      await WorkflowModel.findByIdAndUpdate('workflow-update', { isActive: false });

      const updated = await WorkflowModel.findById('workflow-update').lean();
      expect(updated?.isActive).toBe(false);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'workflow-delete',
            userId: 'user-123',
            name: 'To Be Deleted',
            description: 'This will be deleted',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should delete workflow by ID', async () => {
      await WorkflowModel.findByIdAndDelete('workflow-delete');

      const count = await countDocuments('workflows');
      expect(count).toBe(0);

      const deleted = await WorkflowModel.findById('workflow-delete').lean();
      expect(deleted).toBeNull();
    });
  });

  describe('Complex Queries', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        workflows: [
          {
            _id: 'workflow-1',
            userId: 'user-123',
            name: 'Active Workflow',
            description: 'Active',
            trigger: { type: 'email', conditions: [] },
            nodes: [
              {
                id: 'automation-rule-1',
                type: 'automation_rule',
                data: { ruleId: 'rule-1' },
              },
            ],
            edges: [],
            isActive: true,
          },
          {
            _id: 'workflow-2',
            userId: 'user-123',
            name: 'Inactive Workflow',
            description: 'Inactive',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: false,
          },
          {
            _id: 'workflow-3',
            userId: 'user-456',
            name: 'Other User Workflow',
            description: 'Other user',
            trigger: { type: 'email', conditions: [] },
            nodes: [],
            edges: [],
            isActive: true,
          },
        ],
      });
    });

    it('should find active workflows for a specific user', async () => {
      const activeWorkflows = await WorkflowModel.find({
        userId: 'user-123',
        isActive: true,
      }).lean();

      expect(activeWorkflows).toHaveLength(1);
      expect(activeWorkflows[0]._id).toBe('workflow-1');
    });

    it('should find workflows with automation rule nodes for a user', async () => {
      const workflowsWithRules = await WorkflowModel.find({
        userId: 'user-123',
        'nodes.type': 'automation_rule',
      }).lean();

      expect(workflowsWithRules).toHaveLength(1);
      expect(workflowsWithRules[0]._id).toBe('workflow-1');
    });

    it('should count workflows by user', async () => {
      const user123Count = await WorkflowModel.countDocuments({ userId: 'user-123' });
      const user456Count = await WorkflowModel.countDocuments({ userId: 'user-456' });

      expect(user123Count).toBe(2);
      expect(user456Count).toBe(1);
    });
  });
});

