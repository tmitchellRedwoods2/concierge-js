/**
 * Database Unit Tests for User Model - Role and AccessMode
 * Tests actual database operations using in-memory MongoDB
 * 
 * These tests ensure that:
 * - Role and accessMode fields are properly defined in schema
 * - Default values are set correctly
 * - Validation works for role and accessMode
 * - accessMode is only applicable for client role
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/db/models/User');

import getUser from '@/lib/db/models/User';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../utils/db-test-helper';
import bcrypt from 'bcryptjs';

describe('User Model - Role and AccessMode Database Tests', () => {
  beforeAll(async () => {
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
    it('should have role and accessMode fields in schema', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-user-1',
        email: 'test1@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-user-1' }).lean();
      expect(saved?.role).toBe('client');
      expect(saved?.accessMode).toBe('self-service');
    });

    it('should set default role to client if not provided', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-user-2',
        email: 'test2@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        // role not provided
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-user-2' }).lean();
      expect(saved?.role).toBe('client');
    });

    it('should set default accessMode to self-service for clients', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-user-3',
        email: 'test3@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        // accessMode not provided
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-user-3' }).lean();
      expect(saved?.accessMode).toBe('self-service');
    });

    it('should allow admin role without accessMode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-admin-1',
        email: 'admin1@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        // accessMode not provided (should be undefined for admin)
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-admin-1' }).lean();
      expect(saved?.role).toBe('admin');
      expect(saved?.accessMode).toBeUndefined();
    });

    it('should allow agent role without accessMode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-agent-1',
        email: 'agent1@example.com',
        password: hashedPassword,
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
        // accessMode not provided (should be undefined for agent)
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-agent-1' }).lean();
      expect(saved?.role).toBe('agent');
      expect(saved?.accessMode).toBeUndefined();
    });
  });

  describe('Role Enum Validation', () => {
    it('should reject invalid role values', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-invalid-role',
        email: 'invalid@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'invalid-role' as any,
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('AccessMode Enum Validation', () => {
    it('should reject invalid accessMode values', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-invalid-mode',
        email: 'invalid-mode@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        accessMode: 'invalid-mode' as any,
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Client Access Modes', () => {
    it('should save client with hands-off access mode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-hands-off',
        email: 'handsoff@example.com',
        password: hashedPassword,
        firstName: 'Hands',
        lastName: 'Off',
        role: 'client',
        accessMode: 'hands-off',
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-hands-off' }).lean();
      expect(saved?.role).toBe('client');
      expect(saved?.accessMode).toBe('hands-off');
    });

    it('should save client with self-service access mode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-self-service',
        email: 'selfservice@example.com',
        password: hashedPassword,
        firstName: 'Self',
        lastName: 'Service',
        role: 'client',
        accessMode: 'self-service',
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-self-service' }).lean();
      expect(saved?.role).toBe('client');
      expect(saved?.accessMode).toBe('self-service');
    });

    it('should save client with ai-only access mode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-ai-only',
        email: 'aionly@example.com',
        password: hashedPassword,
        firstName: 'AI',
        lastName: 'Only',
        role: 'client',
        accessMode: 'ai-only',
      });

      await user.save();

      const saved = await User.findOne({ username: 'test-ai-only' }).lean();
      expect(saved?.role).toBe('client');
      expect(saved?.accessMode).toBe('ai-only');
    });
  });

  describe('Update Operations', () => {
    it('should allow updating user role', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-update-role',
        email: 'updaterole@example.com',
        password: hashedPassword,
        firstName: 'Update',
        lastName: 'Role',
        role: 'client',
        accessMode: 'self-service',
      });

      await user.save();

      // Update role to admin
      await User.updateOne(
        { username: 'test-update-role' },
        { role: 'admin', $unset: { accessMode: 1 } }
      );

      const updated = await User.findOne({ username: 'test-update-role' }).lean();
      expect(updated?.role).toBe('admin');
      expect(updated?.accessMode).toBeUndefined();
    });

    it('should allow updating client accessMode', async () => {
      const User = getUser();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const user = new User({
        username: 'test-update-mode',
        email: 'updatemode@example.com',
        password: hashedPassword,
        firstName: 'Update',
        lastName: 'Mode',
        role: 'client',
        accessMode: 'self-service',
      });

      await user.save();

      // Update accessMode
      await User.updateOne(
        { username: 'test-update-mode' },
        { accessMode: 'hands-off' }
      );

      const updated = await User.findOne({ username: 'test-update-mode' }).lean();
      expect(updated?.accessMode).toBe('hands-off');
    });
  });
});

