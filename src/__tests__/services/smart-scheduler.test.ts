import { SmartScheduler } from '@/lib/services/smart-scheduler';

// Mock the CalendarEvent model
jest.mock('@/lib/models/CalendarEvent', () => ({
  CalendarEvent: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: 'test-event-id' }),
  })),
}));

// Mock the automation engine
jest.mock('@/lib/services/automation-engine', () => ({
  automationEngine: {
    executeRule: jest.fn().mockResolvedValue(true),
  },
}));

describe('SmartScheduler', () => {
  let smartScheduler: SmartScheduler;

  beforeEach(() => {
    smartScheduler = new SmartScheduler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addRule', () => {
    it('should add a new scheduling rule', () => {
      const rule = {
        userId: 'test-user',
        name: 'Work Hours Rule',
        description: 'Prefers work hours scheduling',
        conditions: {
          timeOfDay: { start: '09:00', end: '17:00' },
          daysOfWeek: [1, 2, 3, 4, 5],
          duration: { min: 30, max: 120 }
        },
        preferences: {
          preferredTimes: ['10:00', '14:00'],
          avoidTimes: ['12:00'],
          maxDailyEvents: 6
        },
        enabled: true
      };

      const ruleId = smartScheduler.addRule(rule);

      expect(ruleId).toBeDefined();
      expect(ruleId).toMatch(/^scheduler_\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs for different rules', () => {
      const rule1 = {
        userId: 'user1',
        name: 'Rule 1',
        description: 'First rule',
        conditions: {},
        preferences: {},
        enabled: true
      };

      const rule2 = {
        userId: 'user2',
        name: 'Rule 2',
        description: 'Second rule',
        conditions: {},
        preferences: {},
        enabled: true
      };

      const id1 = smartScheduler.addRule(rule1);
      const id2 = smartScheduler.addRule(rule2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('findOptimalTime', () => {
    it('should find optimal time for event', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting',
        flexible: true
      };

      // Add a scheduling rule
      smartScheduler.addRule({
        userId,
        name: 'Work Hours Rule',
        description: 'Work hours preference',
        conditions: {
          timeOfDay: { start: '09:00', end: '17:00' },
          daysOfWeek: [1, 2, 3, 4, 5]
        },
        preferences: {
          preferredTimes: ['10:00', '14:00'],
          avoidTimes: [],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeDefined();
      expect(result?.startTime).toBeInstanceOf(Date);
      expect(result?.endTime).toBeInstanceOf(Date);
      expect(result?.confidence).toBeGreaterThan(0);
    });

    it('should return null when no optimal time found', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting',
        flexible: false
      };

      // No scheduling rules added
      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeNull();
    });

    it('should consider time of day preferences', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // Add rule that prefers morning hours
      smartScheduler.addRule({
        userId,
        name: 'Morning Rule',
        description: 'Prefers morning hours',
        conditions: {
          timeOfDay: { start: '08:00', end: '12:00' }
        },
        preferences: {
          preferredTimes: ['09:00', '10:00'],
          avoidTimes: [],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeDefined();
      if (result) {
        const hour = result.startTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(12);
      }
    });

    it('should consider days of week preferences', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // Add rule that only allows weekdays
      smartScheduler.addRule({
        userId,
        name: 'Weekday Rule',
        description: 'Only weekdays',
        conditions: {
          daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
        },
        preferences: {
          preferredTimes: ['10:00'],
          avoidTimes: [],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeDefined();
      if (result) {
        const dayOfWeek = result.startTime.getDay();
        expect(dayOfWeek).toBeGreaterThanOrEqual(1);
        expect(dayOfWeek).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('autoScheduleEvent', () => {
    it('should auto-schedule an event successfully', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Auto Scheduled Meeting',
        duration: 60,
        type: 'meeting',
        description: 'Test meeting',
        location: 'Conference Room A'
      };

      // Add a scheduling rule
      smartScheduler.addRule({
        userId,
        name: 'Work Hours Rule',
        description: 'Work hours preference',
        conditions: {
          timeOfDay: { start: '09:00', end: '17:00' }
        },
        preferences: {
          preferredTimes: ['10:00'],
          avoidTimes: [],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.autoScheduleEvent(userId, eventData);

      expect(result).toBeDefined();
      expect(result?.title).toBe('Auto Scheduled Meeting');
      expect(result?.startDate).toBeDefined();
      expect(result?.endDate).toBeDefined();
    });

    it('should return null when no optimal time found', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // No scheduling rules
      const result = await smartScheduler.autoScheduleEvent(userId, eventData);

      expect(result).toBeNull();
    });

    it('should trigger automation after scheduling', async () => {
      const { automationEngine } = require('@/lib/services/automation-engine');

      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // Add a scheduling rule
      smartScheduler.addRule({
        userId,
        name: 'Work Hours Rule',
        description: 'Work hours preference',
        conditions: {
          timeOfDay: { start: '09:00', end: '17:00' }
        },
        preferences: {
          preferredTimes: ['10:00'],
          avoidTimes: [],
          maxDailyEvents: 6
        },
        enabled: true
      });

      await smartScheduler.autoScheduleEvent(userId, eventData);

      expect(automationEngine.executeRule).toHaveBeenCalledWith('auto_schedule_notification', {
        userId,
        triggerData: {
          event: expect.any(Object),
          schedulingConfidence: expect.any(Number)
        }
      });
    });
  });

  describe('getUserRules', () => {
    it('should return rules for a specific user', () => {
      const user1Rule = {
        userId: 'user1',
        name: 'User 1 Rule',
        description: 'Rule for user 1',
        conditions: {},
        preferences: {},
        enabled: true
      };

      const user2Rule = {
        userId: 'user2',
        name: 'User 2 Rule',
        description: 'Rule for user 2',
        conditions: {},
        preferences: {},
        enabled: true
      };

      smartScheduler.addRule(user1Rule);
      smartScheduler.addRule(user2Rule);

      const user1Rules = smartScheduler.getUserRules('user1');
      const user2Rules = smartScheduler.getUserRules('user2');

      expect(user1Rules).toHaveLength(1);
      expect(user1Rules[0].name).toBe('User 1 Rule');
      expect(user2Rules).toHaveLength(1);
      expect(user2Rules[0].name).toBe('User 2 Rule');
    });
  });

  describe('scoring system', () => {
    it('should score time slots based on rules', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // Add rule with specific preferences
      smartScheduler.addRule({
        userId,
        name: 'Scoring Rule',
        description: 'Rule for testing scoring',
        conditions: {
          timeOfDay: { start: '10:00', end: '11:00' },
          duration: { min: 30, max: 90 }
        },
        preferences: {
          preferredTimes: ['10:30'],
          avoidTimes: ['10:45'],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeDefined();
      expect(result?.confidence).toBeGreaterThan(0);
    });

    it('should penalize avoided times', async () => {
      const userId = 'test-user';
      const eventData = {
        title: 'Test Meeting',
        duration: 60,
        type: 'meeting'
      };

      // Add rule that avoids lunch time
      smartScheduler.addRule({
        userId,
        name: 'Avoid Lunch Rule',
        description: 'Avoids lunch time',
        conditions: {
          timeOfDay: { start: '09:00', end: '17:00' }
        },
        preferences: {
          preferredTimes: ['10:00'],
          avoidTimes: ['12:00', '13:00'],
          maxDailyEvents: 6
        },
        enabled: true
      });

      const result = await smartScheduler.findOptimalTime(userId, eventData);

      expect(result).toBeDefined();
      if (result) {
        const hour = result.startTime.getHours();
        expect(hour).not.toBe(12);
        expect(hour).not.toBe(13);
      }
    });
  });
});
