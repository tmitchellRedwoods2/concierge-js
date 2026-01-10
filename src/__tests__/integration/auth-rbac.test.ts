/**
 * Integration Tests - Authentication with RBAC
 * Tests the complete flow: User login -> Session with role/accessMode -> Permission checks
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/db/models/User');

import { NextRequest } from 'next/server';
import getUser from '@/lib/db/models/User';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../utils/db-test-helper';
import bcrypt from 'bcryptjs';
import {
  requireAuth,
  requireRole,
  requirePermission,
} from '@/lib/auth/middleware';

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('Authentication RBAC Integration Tests', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    await setupTestDatabase();
  }, 60000);

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Client Self-Service Flow', () => {
    it('should authenticate client and include role/accessMode in session', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-client-ss',
        email: 'client-ss@example.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'SelfService',
        role: 'client',
        accessMode: 'self-service',
      });
      await user.save();

      // Mock auth to return the user's session
      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          accessMode: user.accessMode,
          plan: user.plan,
        },
      } as any);

      const authContext = await requireAuth();
      
      expect(authContext).not.toBeNull();
      expect(authContext?.userId).toBe(user._id.toString());
      expect(authContext?.role).toBe('client');
      expect(authContext?.accessMode).toBe('self-service');
    });

    it('should allow client self-service to access dashboard permission', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-client-ss-2',
        email: 'client-ss-2@example.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'SelfService2',
        role: 'client',
        accessMode: 'self-service',
      });
      await user.save();

      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          role: user.role,
          accessMode: user.accessMode,
        },
      } as any);

      const authContext = await requirePermission('view:dashboard');
      
      expect(authContext).not.toBeNull();
      expect(authContext?.role).toBe('client');
    });
  });

  describe('Client Hands-Off Flow', () => {
    it('should authenticate client hands-off and deny dashboard access', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-client-ho',
        email: 'client-ho@example.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'HandsOff',
        role: 'client',
        accessMode: 'hands-off',
      });
      await user.save();

      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          role: user.role,
          accessMode: user.accessMode,
        },
      } as any);

      const authContext = await requirePermission('view:dashboard');
      
      expect(authContext).toBeNull(); // Should be denied
    });

    it('should allow client hands-off to access messages', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-client-ho-2',
        email: 'client-ho-2@example.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'HandsOff2',
        role: 'client',
        accessMode: 'hands-off',
      });
      await user.save();

      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          role: user.role,
          accessMode: user.accessMode,
        },
      } as any);

      const authContext = await requirePermission('view:messages');
      
      expect(authContext).not.toBeNull();
      expect(authContext?.accessMode).toBe('hands-off');
    });
  });

  describe('Admin Flow', () => {
    it('should authenticate admin and grant all permissions', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
      await user.save();

      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          role: user.role,
        },
      } as any);

      const authContext = await requireRole(['admin']);
      
      expect(authContext).not.toBeNull();
      expect(authContext?.role).toBe('admin');
      
      // Admin should have all permissions
      const manageSystem = await requirePermission('manage:system');
      expect(manageSystem).not.toBeNull();
      
      const viewAdmin = await requirePermission('view:admin');
      expect(viewAdmin).not.toBeNull();
    });
  });

  describe('Agent Flow', () => {
    it('should authenticate agent and allow service editing', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-agent',
        email: 'agent@example.com',
        password: hashedPassword,
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
      });
      await user.save();

      mockAuth.mockResolvedValue({
        user: {
          id: user._id.toString(),
          role: user.role,
        },
      } as any);

      const authContext = await requireRole(['agent']);
      
      expect(authContext).not.toBeNull();
      expect(authContext?.role).toBe('agent');
      
      // Agent should be able to edit services
      const editCalendar = await requirePermission('edit:calendar');
      expect(editCalendar).not.toBeNull();
      
      // Agent should not have UI access
      const viewDashboard = await requirePermission('view:dashboard');
      expect(viewDashboard).toBeNull();
    });
  });
});
