import { EmailTriggerService } from '@/lib/services/email-trigger';

// Mock the automation engine
jest.mock('@/lib/services/automation-engine', () => ({
  automationEngine: {
    executeRule: jest.fn().mockResolvedValue(true),
  },
}));

describe('EmailTriggerService', () => {
  let emailTriggerService: EmailTriggerService;

  beforeEach(() => {
    emailTriggerService = new EmailTriggerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTrigger', () => {
    it('should add a new email trigger', () => {
      const trigger = {
        userId: 'test-user',
        patterns: ['appointment', 'doctor'],
        ruleId: 'test-rule-id',
        enabled: true
      };

      const triggerId = emailTriggerService.addTrigger(trigger);

      expect(triggerId).toBeDefined();
      expect(triggerId).toMatch(/^email_trigger_\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs for different triggers', () => {
      const trigger1 = {
        userId: 'user1',
        patterns: ['appointment'],
        ruleId: 'rule1',
        enabled: true
      };

      const trigger2 = {
        userId: 'user2',
        patterns: ['meeting'],
        ruleId: 'rule2',
        enabled: true
      };

      const id1 = emailTriggerService.addTrigger(trigger1);
      const id2 = emailTriggerService.addTrigger(trigger2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('processEmail', () => {
    it('should process email and trigger matching rules', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      // Add a trigger
      const triggerId = emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['appointment', 'doctor'],
        ruleId: 'test-rule-id',
        enabled: true
      });

      // Process an email that should match
      const email = {
        from: 'doctor@example.com',
        subject: 'Your appointment is scheduled',
        body: 'Please come for your appointment tomorrow',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('test-rule-id', {
        userId: 'test-user',
        triggerData: {
          email,
          matchedPatterns: ['appointment'],
          triggerId
        }
      });
    });

    it('should not trigger rules for non-matching emails', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      // Add a trigger
      emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['appointment', 'doctor'],
        ruleId: 'test-rule-id',
        enabled: true
      });

      // Process an email that should not match
      const email = {
        from: 'newsletter@example.com',
        subject: 'Weekly Newsletter',
        body: 'Check out our latest updates',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).not.toHaveBeenCalled();
    });

    it('should only process triggers for the correct user', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      // Add triggers for different users
      emailTriggerService.addTrigger({
        userId: 'user1',
        patterns: ['appointment'],
        ruleId: 'user1-rule',
        enabled: true
      });

      emailTriggerService.addTrigger({
        userId: 'user2',
        patterns: ['appointment'],
        ruleId: 'user2-rule',
        enabled: true
      });

      // Process email for user1
      const email = {
        from: 'doctor@example.com',
        subject: 'Your appointment is scheduled',
        body: 'Please come for your appointment',
        userId: 'user1'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).toHaveBeenCalledTimes(1);
      expect(automationEngine.executeRule).toHaveBeenCalledWith('user1-rule', expect.any(Object));
    });

    it('should not process disabled triggers', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      // Add a disabled trigger
      emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['appointment'],
        ruleId: 'disabled-rule',
        enabled: false
      });

      const email = {
        from: 'doctor@example.com',
        subject: 'Your appointment is scheduled',
        body: 'Please come for your appointment',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).not.toHaveBeenCalled();
    });

    it('should match multiple patterns in the same email', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      // Add a trigger with multiple patterns
      emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['appointment', 'doctor', 'medical'],
        ruleId: 'multi-pattern-rule',
        enabled: true
      });

      const email = {
        from: 'doctor@example.com',
        subject: 'Your medical appointment is scheduled',
        body: 'Please come for your appointment with Dr. Smith',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('multi-pattern-rule', {
        userId: 'test-user',
        triggerData: {
          email,
          matchedPatterns: expect.arrayContaining(['appointment', 'medical']),
          triggerId: expect.any(String)
        }
      });
    });
  });

  describe('getUserTriggers', () => {
    it('should return triggers for a specific user', () => {
      const user1Trigger = {
        userId: 'user1',
        patterns: ['appointment'],
        ruleId: 'user1-rule',
        enabled: true
      };

      const user2Trigger = {
        userId: 'user2',
        patterns: ['meeting'],
        ruleId: 'user2-rule',
        enabled: true
      };

      emailTriggerService.addTrigger(user1Trigger);
      emailTriggerService.addTrigger(user2Trigger);

      const user1Triggers = emailTriggerService.getUserTriggers('user1');
      const user2Triggers = emailTriggerService.getUserTriggers('user2');

      expect(user1Triggers).toHaveLength(1);
      expect(user1Triggers[0].patterns).toEqual(['appointment']);
      expect(user2Triggers).toHaveLength(1);
      expect(user2Triggers[0].patterns).toEqual(['meeting']);
    });
  });

  describe('deleteTrigger', () => {
    it('should delete a trigger', () => {
      const triggerId = emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['appointment'],
        ruleId: 'test-rule',
        enabled: true
      });

      const deleteResult = emailTriggerService.deleteTrigger(triggerId);
      
      expect(deleteResult).toBe(true);
      
      const userTriggers = emailTriggerService.getUserTriggers('test-user');
      expect(userTriggers).toHaveLength(0);
    });

    it('should return false for non-existent trigger', () => {
      const result = emailTriggerService.deleteTrigger('non-existent-trigger');
      expect(result).toBe(false);
    });
  });

  describe('pattern matching', () => {
    it('should match case-insensitive patterns', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['APPOINTMENT', 'Doctor'],
        ruleId: 'case-insensitive-rule',
        enabled: true
      });

      const email = {
        from: 'doctor@example.com',
        subject: 'your appointment is scheduled',
        body: 'Please come for your appointment',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('case-insensitive-rule', {
        userId: 'test-user',
        triggerData: {
          email,
          matchedPatterns: expect.arrayContaining(['APPOINTMENT']),
          triggerId: expect.any(String)
        }
      });
    });

    it('should search in both subject and body', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      emailTriggerService.addTrigger({
        userId: 'test-user',
        patterns: ['urgent'],
        ruleId: 'urgent-rule',
        enabled: true
      });

      // Test pattern in subject
      const email1 = {
        from: 'admin@example.com',
        subject: 'Urgent: Action Required',
        body: 'Please take action',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email1);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('urgent-rule', expect.any(Object));

      // Reset mock
      automationEngine.executeRule.mockClear();

      // Test pattern in body
      const email2 = {
        from: 'admin@example.com',
        subject: 'Important Notice',
        body: 'This is urgent, please respond',
        userId: 'test-user'
      };

      await emailTriggerService.processEmail(email2);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('urgent-rule', expect.any(Object));
    });
  });
});
