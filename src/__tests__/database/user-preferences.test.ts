/**
 * Database Unit Tests for UserPreferences Model
 * Tests actual database operations using in-memory MongoDB
 * 
 * These tests ensure that:
 * - All schema fields are properly defined
 * - Apple Calendar credentials are saved and retrieved correctly
 * - Calendar preferences persist correctly
 * - Edge cases are handled properly
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/models/UserPreferences');

import { UserPreferences } from '@/lib/models/UserPreferences';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  countDocuments,
} from '../utils/db-test-helper';

describe('UserPreferences Model - Database Tests', () => {
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

  describe('Schema Validation', () => {
    it('should have all required calendar preference fields in schema', async () => {
      // Test by actually creating a document - if schema is missing fields, this will fail
      const preferences = new UserPreferences({
        userId: 'schema-test-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'test@example.com',
            password: 'test-password',
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      // If schema doesn't have appleCalendarConfig, this will fail validation or not save properly
      await preferences.save();

      // Verify the data was saved correctly (proves schema has the fields)
      const saved = await UserPreferences.findOne({ userId: 'schema-test-1' }).lean();
      expect(saved?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.serverUrl).toBe('https://caldav.icloud.com');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.username).toBe('test@example.com');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe('test-password');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe('/calendars');
    });

    it('should have all sync settings fields in schema', async () => {
      // Test by actually creating a document with all sync settings
      const preferences = new UserPreferences({
        userId: 'schema-test-2',
        calendarPreferences: {
          primaryProvider: 'internal',
          syncEnabled: true,
          syncDirection: 'bidirectional',
          syncSettings: {
            autoSync: true,
            syncInterval: 30,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      await preferences.save();

      // Verify all sync settings were saved correctly (proves schema has the fields)
      const saved = await UserPreferences.findOne({ userId: 'schema-test-2' }).lean();
      expect(saved?.calendarPreferences?.syncSettings).toBeDefined();
      expect(saved?.calendarPreferences?.syncSettings?.autoSync).toBe(true);
      expect(saved?.calendarPreferences?.syncSettings?.syncInterval).toBe(30);
      expect(saved?.calendarPreferences?.syncSettings?.syncOnCreate).toBe(true);
      expect(saved?.calendarPreferences?.syncSettings?.syncOnUpdate).toBe(true);
      expect(saved?.calendarPreferences?.syncSettings?.syncOnDelete).toBe(true);
    });
  });

  describe('Create Operations - Apple Calendar Config', () => {
    it('should create user preferences with Apple Calendar configuration', async () => {
      const preferencesData = {
        userId: 'user-123',
        calendarPreferences: {
          primaryProvider: 'apple' as const,
          syncEnabled: true,
          syncDirection: 'internal-to-external' as const,
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'test@example.com',
            password: 'abcd-efgh-ijkl-mnop',
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      };

      const preferences = new UserPreferences(preferencesData);
      await preferences.save();

      // Verify preferences were saved
      const count = await countDocuments('userpreferences');
      expect(count).toBe(1);

      // Verify Apple Calendar config was saved
      const saved = await UserPreferences.findOne({ userId: 'user-123' }).lean();
      expect(saved).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.serverUrl).toBe('https://caldav.icloud.com');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.username).toBe('test@example.com');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe('abcd-efgh-ijkl-mnop');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe('/calendars');
    });

    it('should save Apple Calendar config with spaces in password (should be cleaned by service layer)', async () => {
      const preferencesData = {
        userId: 'user-456',
        calendarPreferences: {
          primaryProvider: 'apple' as const,
          syncEnabled: true,
          syncDirection: 'internal-to-external' as const,
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'test@example.com',
            password: 'abcd-efgh-ijkl-mnop ', // Note: space at end
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      };

      const preferences = new UserPreferences(preferencesData);
      await preferences.save();

      const saved = await UserPreferences.findOne({ userId: 'user-456' }).lean();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe('abcd-efgh-ijkl-mnop ');
      // Note: The service layer should clean this, but the database stores what we give it
    });

    it('should create user preferences without Apple Calendar config', async () => {
      const preferencesData = {
        userId: 'user-789',
        calendarPreferences: {
          primaryProvider: 'internal' as const,
          syncEnabled: false,
          syncDirection: 'internal-to-external' as const,
          syncSettings: {
            autoSync: false,
            syncInterval: 30,
            syncOnCreate: false,
            syncOnUpdate: false,
            syncOnDelete: false,
          },
        },
      };

      const preferences = new UserPreferences(preferencesData);
      await preferences.save();

      const saved = await UserPreferences.findOne({ userId: 'user-789' }).lean();
      expect(saved).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig).toBeUndefined();
    });
  });

  describe('Read Operations - Apple Calendar Config', () => {
    beforeEach(async () => {
      // Seed test data
      await new UserPreferences({
        userId: 'user-read-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'read-test@example.com',
            password: 'read-password-1234',
            calendarPath: '/calendars/users/read-test@example.com/calendar/',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      }).save();

      await new UserPreferences({
        userId: 'user-read-2',
        calendarPreferences: {
          primaryProvider: 'internal',
          syncEnabled: false,
          syncDirection: 'internal-to-external',
          syncSettings: {
            autoSync: false,
            syncInterval: 30,
            syncOnCreate: false,
            syncOnUpdate: false,
            syncOnDelete: false,
          },
        },
      }).save();
    });

    it('should retrieve Apple Calendar config for user with config', async () => {
      const preferences = await UserPreferences.findOne({ userId: 'user-read-1' }).lean();
      
      expect(preferences).toBeDefined();
      expect(preferences?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(preferences?.calendarPreferences?.appleCalendarConfig?.serverUrl).toBe('https://caldav.icloud.com');
      expect(preferences?.calendarPreferences?.appleCalendarConfig?.username).toBe('read-test@example.com');
      expect(preferences?.calendarPreferences?.appleCalendarConfig?.password).toBe('read-password-1234');
      expect(preferences?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe('/calendars/users/read-test@example.com/calendar/');
    });

    it('should return undefined for Apple Calendar config when not set', async () => {
      const preferences = await UserPreferences.findOne({ userId: 'user-read-2' }).lean();
      
      expect(preferences).toBeDefined();
      expect(preferences?.calendarPreferences?.appleCalendarConfig).toBeUndefined();
    });

    it('should find users by Apple Calendar username', async () => {
      const preferences = await UserPreferences.findOne({
        'calendarPreferences.appleCalendarConfig.username': 'read-test@example.com',
      }).lean();
      
      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe('user-read-1');
    });
  });

  describe('Update Operations - Apple Calendar Config', () => {
    beforeEach(async () => {
      await new UserPreferences({
        userId: 'user-update-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'old-username@example.com',
            password: 'old-password',
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      }).save();
    });

    it('should update Apple Calendar config', async () => {
      await UserPreferences.findOneAndUpdate(
        { userId: 'user-update-1' },
        {
          $set: {
            'calendarPreferences.appleCalendarConfig': {
              serverUrl: 'https://caldav.icloud.com',
              username: 'new-username@example.com',
              password: 'new-password-5678',
              calendarPath: '/calendars/users/new-username@example.com/calendar/',
            },
          },
        },
        { new: true }
      );

      const updated = await UserPreferences.findOne({ userId: 'user-update-1' }).lean();
      expect(updated?.calendarPreferences?.appleCalendarConfig?.username).toBe('new-username@example.com');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.password).toBe('new-password-5678');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe('/calendars/users/new-username@example.com/calendar/');
    });

    it('should update entire calendarPreferences object including Apple Calendar config', async () => {
      const newPreferences = {
        primaryProvider: 'apple' as const,
        syncEnabled: true,
        syncDirection: 'bidirectional' as const,
        appleCalendarConfig: {
          serverUrl: 'https://caldav.icloud.com',
          username: 'updated-username@example.com',
          password: 'updated-password-9999',
          calendarPath: '/calendars/updated',
        },
        syncSettings: {
          autoSync: true,
          syncInterval: 30,
          syncOnCreate: true,
          syncOnUpdate: true,
          syncOnDelete: true,
        },
      };

      await UserPreferences.findOneAndUpdate(
        { userId: 'user-update-1' },
        {
          $set: {
            calendarPreferences: newPreferences,
          },
        },
        { new: true }
      );

      const updated = await UserPreferences.findOne({ userId: 'user-update-1' }).lean();
      expect(updated?.calendarPreferences?.appleCalendarConfig?.username).toBe('updated-username@example.com');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.password).toBe('updated-password-9999');
      expect(updated?.calendarPreferences?.syncDirection).toBe('bidirectional');
      expect(updated?.calendarPreferences?.syncSettings?.syncInterval).toBe(30);
    });

    it('should add Apple Calendar config to existing preferences', async () => {
      // Create preferences without Apple Calendar config
      await new UserPreferences({
        userId: 'user-update-2',
        calendarPreferences: {
          primaryProvider: 'internal',
          syncEnabled: false,
          syncDirection: 'internal-to-external',
          syncSettings: {
            autoSync: false,
            syncInterval: 15,
            syncOnCreate: false,
            syncOnUpdate: false,
            syncOnDelete: false,
          },
        },
      }).save();

      // Add Apple Calendar config
      await UserPreferences.findOneAndUpdate(
        { userId: 'user-update-2' },
        {
          $set: {
            'calendarPreferences.appleCalendarConfig': {
              serverUrl: 'https://caldav.icloud.com',
              username: 'added-username@example.com',
              password: 'added-password',
              calendarPath: '/calendars',
            },
            'calendarPreferences.primaryProvider': 'apple',
            'calendarPreferences.syncEnabled': true,
          },
        },
        { new: true }
      );

      const updated = await UserPreferences.findOne({ userId: 'user-update-2' }).lean();
      expect(updated?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(updated?.calendarPreferences?.appleCalendarConfig?.username).toBe('added-username@example.com');
      expect(updated?.calendarPreferences?.primaryProvider).toBe('apple');
      expect(updated?.calendarPreferences?.syncEnabled).toBe(true);
    });

    it('should remove Apple Calendar config when set to null', async () => {
      await UserPreferences.findOneAndUpdate(
        { userId: 'user-update-1' },
        {
          $unset: {
            'calendarPreferences.appleCalendarConfig': '',
          },
        },
        { new: true }
      );

      const updated = await UserPreferences.findOne({ userId: 'user-update-1' }).lean();
      expect(updated?.calendarPreferences?.appleCalendarConfig).toBeUndefined();
    });
  });

  describe('Edge Cases - Apple Calendar Config', () => {
    it('should handle very long App-Specific Password', async () => {
      const longPassword = 'a'.repeat(100);
      const preferences = new UserPreferences({
        userId: 'user-edge-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'test@example.com',
            password: longPassword,
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      await preferences.save();
      const saved = await UserPreferences.findOne({ userId: 'user-edge-1' }).lean();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe(longPassword);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'abcd-efgh-ijkl-mnop!@#$%^&*()';
      const preferences = new UserPreferences({
        userId: 'user-edge-2',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'test@example.com',
            password: specialPassword,
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      await preferences.save();
      const saved = await UserPreferences.findOne({ userId: 'user-edge-2' }).lean();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe(specialPassword);
    });

    it('should handle empty string values in Apple Calendar config', async () => {
      const preferences = new UserPreferences({
        userId: 'user-edge-3',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: '',
            username: '',
            password: '',
            calendarPath: '',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      await preferences.save();
      const saved = await UserPreferences.findOne({ userId: 'user-edge-3' }).lean();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.serverUrl).toBe('');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.username).toBe('');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe('');
      expect(saved?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe('');
    });

    it('should preserve all Apple Calendar config fields when updating other preferences', async () => {
      await new UserPreferences({
        userId: 'user-edge-4',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'preserve@example.com',
            password: 'preserve-password',
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      }).save();

      // Update only sync settings
      await UserPreferences.findOneAndUpdate(
        { userId: 'user-edge-4' },
        {
          $set: {
            'calendarPreferences.syncSettings.syncInterval': 30,
          },
        },
        { new: true }
      );

      const updated = await UserPreferences.findOne({ userId: 'user-edge-4' }).lean();
      // Apple Calendar config should still be there
      expect(updated?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(updated?.calendarPreferences?.appleCalendarConfig?.username).toBe('preserve@example.com');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.password).toBe('preserve-password');
      // Sync interval should be updated
      expect(updated?.calendarPreferences?.syncSettings?.syncInterval).toBe(30);
    });
  });

  describe('Data Integrity - Apple Calendar Config', () => {
    it('should maintain data integrity when saving and retrieving', async () => {
      const originalConfig = {
        serverUrl: 'https://caldav.icloud.com',
        username: 'integrity@example.com',
        password: 'integrity-password-1234',
        calendarPath: '/calendars/users/integrity@example.com/calendar/',
      };

      const preferences = new UserPreferences({
        userId: 'user-integrity-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: originalConfig,
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      });

      await preferences.save();

      const saved = await UserPreferences.findOne({ userId: 'user-integrity-1' }).lean();
      const savedConfig = saved?.calendarPreferences?.appleCalendarConfig;

      expect(savedConfig).toBeDefined();
      expect(savedConfig?.serverUrl).toBe(originalConfig.serverUrl);
      expect(savedConfig?.username).toBe(originalConfig.username);
      expect(savedConfig?.password).toBe(originalConfig.password);
      expect(savedConfig?.calendarPath).toBe(originalConfig.calendarPath);
    });

    it('should handle multiple users with different Apple Calendar configs', async () => {
      await new UserPreferences({
        userId: 'user-multi-1',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'user1@example.com',
            password: 'password1',
            calendarPath: '/calendars',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      }).save();

      await new UserPreferences({
        userId: 'user-multi-2',
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'user2@example.com',
            password: 'password2',
            calendarPath: '/calendars/users/user2@example.com/calendar/',
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      }).save();

      const user1 = await UserPreferences.findOne({ userId: 'user-multi-1' }).lean();
      const user2 = await UserPreferences.findOne({ userId: 'user-multi-2' }).lean();

      expect(user1?.calendarPreferences?.appleCalendarConfig?.username).toBe('user1@example.com');
      expect(user1?.calendarPreferences?.appleCalendarConfig?.password).toBe('password1');
      expect(user2?.calendarPreferences?.appleCalendarConfig?.username).toBe('user2@example.com');
      expect(user2?.calendarPreferences?.appleCalendarConfig?.password).toBe('password2');
      expect(user1?.calendarPreferences?.appleCalendarConfig?.password).not.toBe(
        user2?.calendarPreferences?.appleCalendarConfig?.password
      );
    });
  });
});

