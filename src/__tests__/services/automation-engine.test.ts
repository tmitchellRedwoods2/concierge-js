import { AutomationEngine } from '@/lib/services/automation-engine';

// Mock the notification service
jest.mock('@/lib/services/notification-service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendAppointmentConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendAppointmentReminder: jest.fn().mockResolvedValue({ success: true }),
    sendAppointmentCancellation: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock the CalendarEvent model
jest.mock('@/lib/models/CalendarEvent', () => ({
  CalendarEvent: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: 'test-event-id' }),
  })),
}));

describe('AutomationEngine', () => {
  let automationEngine: AutomationEngine;

  beforeEach(() => {
    automationEngine = new AutomationEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addRule', () => {
    it('should add a new automation rule', async () => {
      const rule = {
        name: 'Test Rule',
        description: 'Test automation rule',
        trigger: {
          type: 'schedule',
          conditions: { cron: '0 9 * * *' }
        },
        actions: [{
          type: 'send_email',
          config: { to: 'test@example.com', subject: 'Test' }
        }],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);

      expect(ruleId).toBeDefined();
      expect(ruleId).toMatch(/^rule_\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs for different rules', async () => {
      const rule1 = {
        name: 'Rule 1',
        description: 'First rule',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'test-user'
      };

      const rule2 = {
        name: 'Rule 2',
        description: 'Second rule',
        trigger: { type: 'email', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'test-user'
      };

      const id1 = await automationEngine.addRule(rule1);
      const id2 = await automationEngine.addRule(rule2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('executeRule', () => {
    it('should execute a rule successfully', async () => {
      const rule = {
        name: 'Test Rule',
        description: 'Test automation rule',
        trigger: {
          type: 'schedule',
          conditions: { cron: '0 9 * * *' }
        },
        actions: [{
          type: 'send_email',
          config: { to: 'test@example.com', subject: 'Test' }
        }],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const result = await automationEngine.executeRule(ruleId);

      expect(result).toBe(true);
    });

    it('should return false for non-existent rule', async () => {
      const result = await automationEngine.executeRule('non-existent-rule');
      expect(result).toBe(false);
    });

    it('should return false for disabled rule', async () => {
      const rule = {
        name: 'Disabled Rule',
        description: 'Disabled automation rule',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: false,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const result = await automationEngine.executeRule(ruleId);

      expect(result).toBe(false);
    });
  });

  describe('getUserRules', () => {
    it('should return rules for a specific user', async () => {
      const user1Rule = {
        name: 'User 1 Rule',
        description: 'Rule for user 1',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'user1'
      };

      const user2Rule = {
        name: 'User 2 Rule',
        description: 'Rule for user 2',
        trigger: { type: 'email', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'user2'
      };

      await automationEngine.addRule(user1Rule);
      await automationEngine.addRule(user2Rule);

      const user1Rules = automationEngine.getUserRules('user1');
      const user2Rules = automationEngine.getUserRules('user2');

      expect(user1Rules).toHaveLength(1);
      expect(user1Rules[0].name).toBe('User 1 Rule');
      expect(user2Rules).toHaveLength(1);
      expect(user2Rules[0].name).toBe('User 2 Rule');
    });
  });

  describe('toggleRule', () => {
    it('should enable/disable a rule', async () => {
      const rule = {
        name: 'Toggle Rule',
        description: 'Rule to toggle',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      
      // Disable the rule
      const disableResult = await automationEngine.toggleRule(ruleId, false);
      expect(disableResult).toBe(true);

      // Enable the rule
      const enableResult = await automationEngine.toggleRule(ruleId, true);
      expect(enableResult).toBe(true);
    });

    it('should return false for non-existent rule', async () => {
      const result = await automationEngine.toggleRule('non-existent-rule', true);
      expect(result).toBe(false);
    });
  });

  describe('deleteRule', () => {
    it('should delete a rule', async () => {
      const rule = {
        name: 'Delete Rule',
        description: 'Rule to delete',
        trigger: { type: 'schedule', conditions: {} },
        actions: [],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const deleteResult = await automationEngine.deleteRule(ruleId);
      
      expect(deleteResult).toBe(true);
      
      const userRules = automationEngine.getUserRules('test-user');
      expect(userRules).toHaveLength(0);
    });

    it('should return false for non-existent rule', async () => {
      const result = await automationEngine.deleteRule('non-existent-rule');
      expect(result).toBe(false);
    });
  });

  describe('action execution', () => {
    it('should execute send_email action', async () => {
      const rule = {
        name: 'Email Rule',
        description: 'Rule that sends email',
        trigger: { type: 'schedule', conditions: {} },
        actions: [{
          type: 'send_email',
          config: {
            to: 'test@example.com',
            subject: 'Test Email',
            template: 'test_template',
            data: { message: 'Hello World' }
          }
        }],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const result = await automationEngine.executeRule(ruleId);

      expect(result).toBe(true);
    });

    it('should execute create_calendar_event action', async () => {
      const rule = {
        name: 'Calendar Rule',
        description: 'Rule that creates calendar event',
        trigger: { type: 'schedule', conditions: {} },
        actions: [{
          type: 'create_calendar_event',
          config: {
            title: 'Test Event',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 3600000).toISOString(),
            location: 'Test Location'
          }
        }],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const result = await automationEngine.executeRule(ruleId);

      expect(result).toBe(true);
    });

    it('should execute wait action', async () => {
      const startTime = Date.now();
      
      const rule = {
        name: 'Wait Rule',
        description: 'Rule that waits',
        trigger: { type: 'schedule', conditions: {} },
        actions: [{
          type: 'wait',
          config: { duration: 100 } // 100ms
        }],
        enabled: true,
        userId: 'test-user'
      };

      const ruleId = await automationEngine.addRule(rule);
      const result = await automationEngine.executeRule(ruleId);

      const endTime = Date.now();
      expect(result).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
