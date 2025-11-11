/**
 * Database Unit Tests for AutomationRule Model
 * Tests actual database operations using in-memory MongoDB
 */
import { AutomationRule } from '@/lib/models/AutomationRule';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  seedTestDatabase,
  countDocuments,
} from '../utils/db-test-helper';

describe('AutomationRule Model - Database Tests', () => {
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
    it('should create an automation rule in the database', async () => {
      const ruleData = {
        userId: 'user-123',
        name: 'Medical Appointment Detection',
        description: 'Detects medical appointments in emails',
        trigger: {
          type: 'email',
          conditions: {
            patterns: ['appointment', 'doctor', 'medical'],
          },
        },
        actions: [
          {
            type: 'create_calendar_event',
            config: {
              title: 'Medical Appointment',
              location: 'Doctor Office',
            },
          },
          {
            type: 'send_email',
            config: {
              to: '{triggerResult.email}',
              subject: 'Appointment Confirmation',
            },
          },
        ],
        enabled: true,
        executionCount: 0,
      };

      const rule = new AutomationRule(ruleData);
      await rule.save();

      // Verify rule was saved
      const count = await countDocuments('automationrules');
      expect(count).toBe(1);

      // Verify rule data
      const savedRule = await AutomationRule.findOne({ userId: 'user-123' }).lean();
      expect(savedRule).toBeDefined();
      expect(savedRule?.name).toBe('Medical Appointment Detection');
      expect(savedRule?.enabled).toBe(true);
      expect(savedRule?.actions).toHaveLength(2);
      expect(savedRule?.executionCount).toBe(0);
    });

    it('should create rule with template variables in action config', async () => {
      const ruleData = {
        userId: 'user-123',
        name: 'Template Variable Rule',
        description: 'Rule with template variables',
        trigger: {
          type: 'email',
          conditions: { patterns: ['test'] },
        },
        actions: [
          {
            type: 'send_email',
            config: {
              to: '{aiResult.attendee}',
              subject: 'Appointment: {aiResult.title}',
              body: 'Date: {aiResult.date} at {aiResult.time}',
            },
          },
        ],
        enabled: true,
      };

      const rule = new AutomationRule(ruleData);
      await rule.save();

      const savedRule = await AutomationRule.findOne({ name: 'Template Variable Rule' }).lean();
      expect(savedRule).toBeDefined();
      expect(savedRule?.actions[0].config.to).toBe('{aiResult.attendee}');
      expect(savedRule?.actions[0].config.subject).toBe('Appointment: {aiResult.title}');
    });
  });

  describe('Read Operations', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        automationrules: [
          {
            userId: 'user-123',
            name: 'Rule 1',
            description: 'First rule',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: true,
            executionCount: 5,
            lastExecuted: new Date('2024-01-01'),
          },
          {
            userId: 'user-123',
            name: 'Rule 2',
            description: 'Second rule',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'create_calendar_event', config: {} }],
            enabled: false,
            executionCount: 0,
          },
          {
            userId: 'user-456',
            name: 'Rule 3',
            description: 'Third rule',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: true,
            executionCount: 10,
            lastExecuted: new Date('2024-01-02'),
          },
        ],
      });
    });

    it('should find rules by userId', async () => {
      const rules = await AutomationRule.find({ userId: 'user-123' }).lean();
      expect(rules).toHaveLength(2);
      expect(rules.map((r) => r.name)).toContain('Rule 1');
      expect(rules.map((r) => r.name)).toContain('Rule 2');
    });

    it('should find enabled rules', async () => {
      const enabledRules = await AutomationRule.find({ enabled: true }).lean();
      expect(enabledRules).toHaveLength(2);
      expect(enabledRules.map((r) => r.name)).toContain('Rule 1');
      expect(enabledRules.map((r) => r.name)).toContain('Rule 3');
    });

    it('should find rules by trigger type', async () => {
      const emailRules = await AutomationRule.find({ 'trigger.type': 'email' }).lean();
      expect(emailRules).toHaveLength(3);
    });

    it('should find rules by action type', async () => {
      const emailActionRules = await AutomationRule.find({
        'actions.type': 'send_email',
      }).lean();
      expect(emailActionRules).toHaveLength(2);
    });
  });

  describe('Update Operations', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        automationrules: [
          {
            userId: 'user-123',
            name: 'Update Test Rule',
            description: 'To be updated',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: true,
            executionCount: 0,
          },
        ],
      });
    });

    it('should update rule execution count', async () => {
      const rule = await AutomationRule.findOne({ name: 'Update Test Rule' });
      expect(rule?.executionCount).toBe(0);

      await AutomationRule.findByIdAndUpdate(rule?._id, {
        $inc: { executionCount: 1 },
        lastExecuted: new Date(),
      });

      const updated = await AutomationRule.findById(rule?._id).lean();
      expect(updated?.executionCount).toBe(1);
      expect(updated?.lastExecuted).toBeDefined();
    });

    it('should toggle rule enabled status', async () => {
      const rule = await AutomationRule.findOne({ name: 'Update Test Rule' });
      expect(rule?.enabled).toBe(true);

      await AutomationRule.findByIdAndUpdate(rule?._id, { enabled: false });

      const updated = await AutomationRule.findById(rule?._id).lean();
      expect(updated?.enabled).toBe(false);
    });

    it('should update rule actions', async () => {
      const rule = await AutomationRule.findOne({ name: 'Update Test Rule' });
      const newActions = [
        {
          type: 'create_calendar_event',
          config: {
            title: 'New Event',
            location: 'New Location',
          },
        },
        {
          type: 'send_email',
          config: {
            to: 'test@example.com',
            subject: 'New Subject',
          },
        },
      ];

      await AutomationRule.findByIdAndUpdate(rule?._id, { actions: newActions });

      const updated = await AutomationRule.findById(rule?._id).lean();
      expect(updated?.actions).toHaveLength(2);
      expect(updated?.actions[0].type).toBe('create_calendar_event');
      expect(updated?.actions[1].type).toBe('send_email');
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        automationrules: [
          {
            userId: 'user-123',
            name: 'Delete Test Rule',
            description: 'To be deleted',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: true,
            executionCount: 0,
          },
        ],
      });
    });

    it('should delete rule by ID', async () => {
      const rule = await AutomationRule.findOne({ name: 'Delete Test Rule' });
      await AutomationRule.findByIdAndDelete(rule?._id);

      const count = await countDocuments('automationrules');
      expect(count).toBe(0);

      const deleted = await AutomationRule.findById(rule?._id).lean();
      expect(deleted).toBeNull();
    });
  });

  describe('Complex Queries', () => {
    beforeEach(async () => {
      await seedTestDatabase({
        automationrules: [
          {
            userId: 'user-123',
            name: 'Active Rule 1',
            description: 'Active rule',
            trigger: { type: 'email', conditions: { patterns: ['appointment'] } },
            actions: [{ type: 'create_calendar_event', config: {} }],
            enabled: true,
            executionCount: 5,
            lastExecuted: new Date('2024-01-01'),
          },
          {
            userId: 'user-123',
            name: 'Inactive Rule',
            description: 'Inactive rule',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: false,
            executionCount: 0,
          },
          {
            userId: 'user-456',
            name: 'Other User Rule',
            description: 'Other user rule',
            trigger: { type: 'email', conditions: { patterns: ['test'] } },
            actions: [{ type: 'send_email', config: {} }],
            enabled: true,
            executionCount: 10,
            lastExecuted: new Date('2024-01-02'),
          },
        ],
      });
    });

    it('should find enabled rules for a specific user', async () => {
      const enabledRules = await AutomationRule.find({
        userId: 'user-123',
        enabled: true,
      }).lean();

      expect(enabledRules).toHaveLength(1);
      expect(enabledRules[0].name).toBe('Active Rule 1');
    });

    it('should find rules with execution count greater than threshold', async () => {
      const activeRules = await AutomationRule.find({
        executionCount: { $gt: 0 },
      }).lean();

      expect(activeRules).toHaveLength(2);
      expect(activeRules.map((r) => r.name)).toContain('Active Rule 1');
      expect(activeRules.map((r) => r.name)).toContain('Other User Rule');
    });

    it('should find rules by action type for a user', async () => {
      const calendarRules = await AutomationRule.find({
        userId: 'user-123',
        'actions.type': 'create_calendar_event',
      }).lean();

      expect(calendarRules).toHaveLength(1);
      expect(calendarRules[0].name).toBe('Active Rule 1');
    });

    it('should count rules by user', async () => {
      const user123Count = await AutomationRule.countDocuments({ userId: 'user-123' });
      const user456Count = await AutomationRule.countDocuments({ userId: 'user-456' });

      expect(user123Count).toBe(2);
      expect(user456Count).toBe(1);
    });

    it('should find most recently executed rules', async () => {
      const recentRules = await AutomationRule.find()
        .sort({ lastExecuted: -1 })
        .limit(2)
        .lean();

      expect(recentRules).toHaveLength(2);
      expect(recentRules[0].name).toBe('Other User Rule');
      expect(recentRules[1].name).toBe('Active Rule 1');
    });
  });
});

