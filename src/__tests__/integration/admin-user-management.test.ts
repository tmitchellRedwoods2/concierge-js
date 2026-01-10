/**
 * Integration Tests for Admin User Management
 * Tests the complete flow of user management operations
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/mongodb');
jest.unmock('@/lib/db/models/User');

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/users/route';
import { GET as GET_USER, PUT, DELETE } from '@/app/api/admin/users/[userId]/route';
import getUser from '@/lib/db/models/User';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '@/__tests__/utils/db-test-helper';

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const { auth } = require('@/lib/auth');

describe('Admin User Management Integration Tests', () => {
  let mockAdminUser: any;
  let User: any;

  beforeAll(async () => {
    jest.setTimeout(60000);
    await setupTestDatabase();
    User = getUser();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    mockAdminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      plan: 'elite',
      role: 'admin',
    });

    auth.mockResolvedValue({
      user: {
        id: mockAdminUser._id.toString(),
        role: 'admin',
        username: 'admin',
        plan: 'elite',
      },
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Complete User Lifecycle', () => {
    it('should create, read, update, and delete a user', async () => {
      // 1. Create user
      const createRequest = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'lifecycle',
          email: 'lifecycle@test.com',
          password: 'password123',
          firstName: 'Life',
          lastName: 'Cycle',
          plan: 'premium',
          role: 'client',
          accessMode: 'self-service',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);
      const userId = createData.user._id;

      // 2. Read user
      const getRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`);
      const getResponse = await GET_USER(getRequest, { params: Promise.resolve({ userId }) });
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.user.username).toBe('lifecycle');
      expect(getData.user.role).toBe('client');

      // 3. Update user
      const updateRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: 'Updated',
          plan: 'elite',
          accessMode: 'hands-off',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const updateResponse = await PUT(updateRequest, { params: Promise.resolve({ userId }) });
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.user.firstName).toBe('Updated');
      expect(updateData.user.plan).toBe('elite');
      expect(updateData.user.accessMode).toBe('hands-off');

      // 4. Verify in list
      const listRequest = new NextRequest('http://localhost:3000/api/admin/users');
      const listResponse = await GET(listRequest);
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      const foundUser = listData.users.find((u: any) => u._id === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser.firstName).toBe('Updated');

      // 5. Delete user
      const deleteRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const deleteResponse = await DELETE(deleteRequest, { params: Promise.resolve({ userId }) });
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);

      // 6. Verify deletion
      const verifyRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`);
      const verifyResponse = await GET_USER(verifyRequest, { params: Promise.resolve({ userId }) });

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Role and Access Mode Management', () => {
    it('should handle role transitions correctly', async () => {
      // Create client
      const createRequest = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'rolechange',
          email: 'rolechange@test.com',
          password: 'password123',
          firstName: 'Role',
          lastName: 'Change',
          plan: 'basic',
          role: 'client',
          accessMode: 'self-service',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const createResponse = await POST(createRequest);
      const { user } = await createResponse.json();
      const userId = user._id;

      // Change to admin (should clear accessMode)
      const toAdminRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: 'admin',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const toAdminResponse = await PUT(toAdminRequest, { params: Promise.resolve({ userId }) });
      const toAdminData = await toAdminResponse.json();

      expect(toAdminData.user.role).toBe('admin');
      expect(toAdminData.user.accessMode).toBeUndefined();

      // Change back to client (should require accessMode)
      const toClientRequest = new NextRequest(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: 'client',
          accessMode: 'ai-only',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const toClientResponse = await PUT(toClientRequest, { params: Promise.resolve({ userId }) });
      const toClientData = await toClientResponse.json();

      expect(toClientData.user.role).toBe('client');
      expect(toClientData.user.accessMode).toBe('ai-only');
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple user operations', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const createRequest = new NextRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            username: `bulk${i}`,
            email: `bulk${i}@test.com`,
            password: 'password123',
            firstName: 'Bulk',
            lastName: `${i}`,
            plan: 'basic',
            role: 'client',
            accessMode: 'self-service',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(createRequest);
        const data = await response.json();
        users.push(data.user);
      }

      // List all users
      const listRequest = new NextRequest('http://localhost:3000/api/admin/users');
      const listResponse = await GET(listRequest);
      const listData = await listResponse.json();

      expect(listData.users.length).toBeGreaterThanOrEqual(5);

      // Update all users
      for (const user of users) {
        const updateRequest = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            plan: 'premium',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const updateResponse = await PUT(updateRequest, { params: Promise.resolve({ userId: user._id }) });
        expect(updateResponse.status).toBe(200);
      }

      // Verify updates
      const verifyRequest = new NextRequest('http://localhost:3000/api/admin/users');
      const verifyResponse = await GET(verifyRequest);
      const verifyData = await verifyResponse.json();

      const updatedUsers = verifyData.users.filter((u: any) => 
        users.some(created => created._id === u._id)
      );
      expect(updatedUsers.every((u: any) => u.plan === 'premium')).toBe(true);
    });
  });

  describe('Search and Filter Integration', () => {
    beforeEach(async () => {
      // Create diverse set of users
      await User.create({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        plan: 'premium',
        role: 'client',
        accessMode: 'self-service',
      });

      await User.create({
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'hashed',
        firstName: 'Jane',
        lastName: 'Smith',
        plan: 'elite',
        role: 'client',
        accessMode: 'hands-off',
      });

      await User.create({
        username: 'agent1',
        email: 'agent1@example.com',
        password: 'hashed',
        firstName: 'Agent',
        lastName: 'One',
        plan: 'basic',
        role: 'agent',
      });
    });

    it('should search across multiple fields', async () => {
      const searchRequest = new NextRequest('http://localhost:3000/api/admin/users?search=john');
      const searchResponse = await GET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.users.some((u: any) => 
        u.username.includes('john') || 
        u.email.includes('john') ||
        u.firstName === 'John'
      )).toBe(true);
    });

    it('should filter by role and accessMode together', async () => {
      const filterRequest = new NextRequest('http://localhost:3000/api/admin/users?role=client&accessMode=hands-off');
      const filterResponse = await GET(filterRequest);
      const filterData = await filterResponse.json();

      expect(filterData.users.every((u: any) => 
        u.role === 'client' && u.accessMode === 'hands-off'
      )).toBe(true);
    });
  });
});

