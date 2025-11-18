/**
 * API Route Tests for User Preferences
 * Tests the /api/user/preferences endpoint to ensure Apple Calendar config is properly saved and retrieved
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/models/UserPreferences');

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/preferences/route';
import { UserPreferences } from '@/lib/models/UserPreferences';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../../utils/db-test-helper';

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';

describe('User Preferences API - Apple Calendar Config', () => {
  const mockUserId = 'test-user-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
    },
  };

  beforeAll(async () => {
    jest.setTimeout(60000);
    await setupTestDatabase();
  }, 60000);

  beforeEach(async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('PUT /api/user/preferences - Save Apple Calendar Config', () => {
    it('should save Apple Calendar configuration', async () => {
      const appleCalendarConfig = {
        serverUrl: 'https://caldav.icloud.com',
        username: 'test@example.com',
        password: 'abcd-efgh-ijkl-mnop',
        calendarPath: '/calendars',
      };

      const requestBody = {
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig,
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it was saved to database
      const saved = await UserPreferences.findOne({ userId: mockUserId }).lean();
      expect(saved).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig?.serverUrl).toBe(appleCalendarConfig.serverUrl);
      expect(saved?.calendarPreferences?.appleCalendarConfig?.username).toBe(appleCalendarConfig.username);
      expect(saved?.calendarPreferences?.appleCalendarConfig?.password).toBe(appleCalendarConfig.password);
      expect(saved?.calendarPreferences?.appleCalendarConfig?.calendarPath).toBe(appleCalendarConfig.calendarPath);
    });

    it('should update existing Apple Calendar configuration', async () => {
      // Create initial preferences
      await new UserPreferences({
        userId: mockUserId,
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'old@example.com',
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

      // Update with new config
      const newAppleCalendarConfig = {
        serverUrl: 'https://caldav.icloud.com',
        username: 'new@example.com',
        password: 'new-password-5678',
        calendarPath: '/calendars/users/new@example.com/calendar/',
      };

      const requestBody = {
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: newAppleCalendarConfig,
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it was updated
      const updated = await UserPreferences.findOne({ userId: mockUserId }).lean();
      expect(updated?.calendarPreferences?.appleCalendarConfig?.username).toBe('new@example.com');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.password).toBe('new-password-5678');
      expect(updated?.calendarPreferences?.appleCalendarConfig?.password).not.toBe('old-password');
    });

    it('should save preferences without Apple Calendar config', async () => {
      const requestBody = {
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
      };

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it was saved
      const saved = await UserPreferences.findOne({ userId: mockUserId }).lean();
      expect(saved).toBeDefined();
      expect(saved?.calendarPreferences?.appleCalendarConfig).toBeUndefined();
    });
  });

  describe('GET /api/user/preferences - Retrieve Apple Calendar Config', () => {
    it('should retrieve Apple Calendar configuration', async () => {
      // Create preferences with Apple Calendar config
      await new UserPreferences({
        userId: mockUserId,
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig: {
            serverUrl: 'https://caldav.icloud.com',
            username: 'retrieve@example.com',
            password: 'retrieve-password-1234',
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

      const request = new NextRequest('http://localhost:3000/api/user/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.calendarPreferences).toBeDefined();
      expect(data.calendarPreferences.appleCalendarConfig).toBeDefined();
      expect(data.calendarPreferences.appleCalendarConfig.serverUrl).toBe('https://caldav.icloud.com');
      expect(data.calendarPreferences.appleCalendarConfig.username).toBe('retrieve@example.com');
      expect(data.calendarPreferences.appleCalendarConfig.password).toBe('retrieve-password-1234');
      expect(data.calendarPreferences.appleCalendarConfig.calendarPath).toBe('/calendars');
    });

    it('should return undefined for Apple Calendar config when not set', async () => {
      // Create preferences without Apple Calendar config
      await new UserPreferences({
        userId: mockUserId,
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

      const request = new NextRequest('http://localhost:3000/api/user/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.calendarPreferences).toBeDefined();
      expect(data.calendarPreferences.appleCalendarConfig).toBeUndefined();
    });

    it('should create default preferences if user has none', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.calendarPreferences).toBeDefined();
      expect(data.calendarPreferences.primaryProvider).toBe('internal');
      expect(data.calendarPreferences.appleCalendarConfig).toBeUndefined();

      // Verify it was created in database
      const saved = await UserPreferences.findOne({ userId: mockUserId }).lean();
      expect(saved).toBeDefined();
    });
  });

  describe('End-to-End: Save and Retrieve Apple Calendar Config', () => {
    it('should save and then retrieve Apple Calendar configuration correctly', async () => {
      const appleCalendarConfig = {
        serverUrl: 'https://caldav.icloud.com',
        username: 'e2e@example.com',
        password: 'e2e-password-9999',
        calendarPath: '/calendars/users/e2e@example.com/calendar/',
      };

      // Save
      const saveRequestBody = {
        calendarPreferences: {
          primaryProvider: 'apple',
          syncEnabled: true,
          syncDirection: 'internal-to-external',
          appleCalendarConfig,
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true,
          },
        },
      };

      const saveRequest = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(saveRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const saveResponse = await PUT(saveRequest);
      expect(saveResponse.status).toBe(200);

      // Retrieve
      const getRequest = new NextRequest('http://localhost:3000/api/user/preferences');
      const getResponse = await GET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.calendarPreferences.appleCalendarConfig).toBeDefined();
      expect(getData.calendarPreferences.appleCalendarConfig.serverUrl).toBe(appleCalendarConfig.serverUrl);
      expect(getData.calendarPreferences.appleCalendarConfig.username).toBe(appleCalendarConfig.username);
      expect(getData.calendarPreferences.appleCalendarConfig.password).toBe(appleCalendarConfig.password);
      expect(getData.calendarPreferences.appleCalendarConfig.calendarPath).toBe(appleCalendarConfig.calendarPath);
    });
  });
});

