/**
 * API Route Tests for Admin User Management
 * Tests the /api/admin/users endpoints
 */

/**
 * @jest-environment node
 */

// Unmock database modules for real database testing
jest.unmock('@/lib/db/models/User');

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/users/route';
import { GET as GET_USER, PUT, DELETE } from '@/app/api/admin/users/[userId]/route';
import getUser from '@/lib/db/models/User';
import mongoose from 'mongoose';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../../utils/db-test-helper';

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock connectDB to return existing mongoose connection
jest.mock('@/lib/db/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
  connectDB: jest.fn(),
}));

import { auth } from '@/lib/auth';
import * as mongodb from '@/lib/db/mongodb';

const mockConnectDB = mongodb.connectDB as jest.MockedFunction<typeof mongodb.connectDB>;

describe('Admin User Management API', () => {
  const mockAdminId = 'admin-user-123';
  const mockClientId = 'client-user-456';
  const mockAdminSession = {
    user: {
      id: mockAdminId,
      email: 'admin@example.com',
      role: 'admin',
    },
  };
  const mockClientSession = {
    user: {
      id: mockClientId,
      email: 'client@example.com',
      role: 'client',
    },
  };

  beforeAll(async () => {
    jest.setTimeout(60000);
    await setupTestDatabase();
    // Mock connectDB to return the existing mongoose connection
    mockConnectDB.mockResolvedValue(mongoose as any);
  }, 60000);

  beforeEach(async () => {
    (auth as jest.Mock).mockResolvedValue(mockAdminSession);
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/admin/users - List Users', () => {
    it('should return 403 for non-admin users', async () => {
      (auth as jest.Mock).mockResolvedValue(mockClientSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(403);
    });

    it('should return empty list when no users exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return list of users with pagination', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      // Create test users
      await User.create([
        {
          username: 'user1',
          email: 'user1@example.com',
          password: await bcrypt.hash('password1', 10),
          firstName: 'User',
          lastName: 'One',
          role: 'client',
          accessMode: 'self-service',
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: await bcrypt.hash('password2', 10),
          firstName: 'User',
          lastName: 'Two',
          role: 'client',
          accessMode: 'hands-off',
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
      expect(data.users[0]).not.toHaveProperty('password');
      expect(data.users[1]).not.toHaveProperty('password');
    });

    it('should filter users by role', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      await User.create([
        {
          username: 'client1',
          email: 'client1@example.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Client',
          lastName: 'One',
          role: 'client',
          accessMode: 'self-service',
        },
        {
          username: 'admin1',
          email: 'admin1@example.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Admin',
          lastName: 'One',
          role: 'admin',
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/users?role=client');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].role).toBe('client');
    });

    it('should search users by username, email, or name', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      await User.create([
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'John',
          lastName: 'Doe',
          role: 'client',
          accessMode: 'self-service',
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'client',
          accessMode: 'self-service',
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/users?search=john');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].username).toBe('john_doe');
    });
  });

  describe('POST /api/admin/users - Create User', () => {
    it('should return 403 for non-admin users', async () => {
      (auth as jest.Mock).mockResolvedValue(mockClientSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should create a new client user with accessMode', async () => {
      const requestBody = {
        username: 'newclient',
        email: 'newclient@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Client',
        plan: 'premium',
        role: 'client',
        accessMode: 'self-service',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('newclient');
      expect(data.user.email).toBe('newclient@example.com');
      expect(data.user.role).toBe('client');
      expect(data.user.accessMode).toBe('self-service');
      expect(data.user).not.toHaveProperty('password');

      // Verify in database
      const User = getUser();
      const saved = await User.findOne({ username: 'newclient' });
      expect(saved).toBeDefined();
      expect(saved?.accessMode).toBe('self-service');
    });

    it('should create an admin user without accessMode', async () => {
      const requestBody = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        role: 'admin',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.role).toBe('admin');
      expect(data.user.accessMode).toBeUndefined();
    });

    it('should reject creating user with duplicate username', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      await User.create({
        username: 'existing',
        email: 'existing@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Existing',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'existing',
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'client',
          accessMode: 'self-service',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });

    it('should reject creating client without accessMode', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newclient',
          email: 'newclient@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'Client',
          role: 'client',
          // Missing accessMode
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/users/[userId] - Get User', () => {
    it('should return 403 for non-admin users', async () => {
      (auth as jest.Mock).mockResolvedValue(mockClientSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin/users/user123');
      const response = await GET_USER(request, { params: Promise.resolve({ userId: 'user123' }) });
      
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent');
      const response = await GET_USER(request, { params: Promise.resolve({ userId: 'nonexistent' }) });
      
      expect(response.status).toBe(404);
    });

    it('should return user details without password', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`);
      const response = await GET_USER(request, { params: Promise.resolve({ userId: user._id.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('testuser');
      expect(data.user).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/admin/users/[userId] - Update User', () => {
    it('should return 403 for non-admin users', async () => {
      (auth as jest.Mock).mockResolvedValue(mockClientSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin/users/user123', {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await PUT(request, { params: Promise.resolve({ userId: 'user123' }) });
      expect(response.status).toBe(403);
    });

    it('should update user fields', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const user = await User.create({
        username: 'updateuser',
        email: 'update@example.com',
        password: await bcrypt.hash('oldpassword', 10),
        firstName: 'Old',
        lastName: 'Name',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: 'New',
          lastName: 'Name',
          plan: 'elite',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ userId: user._id.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.firstName).toBe('New');
      expect(data.user.lastName).toBe('Name');
      expect(data.user.plan).toBe('elite');
    });

    it('should update user role and accessMode', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const user = await User.create({
        username: 'roleuser',
        email: 'role@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Role',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: 'client',
          accessMode: 'hands-off',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ userId: user._id.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('client');
      expect(data.user.accessMode).toBe('hands-off');
    });

    it('should update password when provided', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const user = await User.create({
        username: 'passuser',
        email: 'pass@example.com',
        password: await bcrypt.hash('oldpassword', 10),
        firstName: 'Password',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          password: 'newpassword123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ userId: user._id.toString() }) });
      expect(response.status).toBe(200);

      // Verify password was updated
      const updated = await User.findById(user._id);
      const isValid = await bcrypt.compare('newpassword123', updated!.password);
      expect(isValid).toBe(true);
    });
  });

  describe('DELETE /api/admin/users/[userId] - Delete User', () => {
    it('should return 403 for non-admin users', async () => {
      (auth as jest.Mock).mockResolvedValue(mockClientSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin/users/user123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params: Promise.resolve({ userId: 'user123' }) });
      expect(response.status).toBe(403);
    });

    it('should delete user', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const user = await User.create({
        username: 'deleteuser',
        email: 'delete@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Delete',
        lastName: 'User',
        role: 'client',
        accessMode: 'self-service',
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${user._id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ userId: user._id.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify user was deleted
      const deleted = await User.findById(user._id);
      expect(deleted).toBeNull();
    });

    it('should prevent admin from deleting themselves', async () => {
      const User = getUser();
      const bcrypt = await import('bcryptjs');
      
      const adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });

      // Mock session to match the admin user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          email: 'admin@example.com',
          role: 'admin',
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${adminUser._id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ userId: adminUser._id.toString() }) });
      expect(response.status).toBe(400);
    });
  });
});
