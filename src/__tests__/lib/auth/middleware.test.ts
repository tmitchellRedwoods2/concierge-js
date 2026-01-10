/**
 * Unit Tests for Role-Based Access Control Middleware
 * Tests middleware functions for route protection
 */

/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireRole,
  requirePermission,
  withAuth,
  withRole,
  withPermission,
  AuthContext,
} from '@/lib/auth/middleware';
import { UserRole, AccessMode } from '@/lib/db/models/User';

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('RBAC Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return auth context when user is authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
          username: 'testuser',
          plan: 'premium',
        },
      } as any);

      const context = await requireAuth();

      expect(context).not.toBeNull();
      expect(context?.userId).toBe('user-123');
      expect(context?.role).toBe('client');
      expect(context?.accessMode).toBe('self-service');
    });

    it('should return null when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const context = await requireAuth();

      expect(context).toBeNull();
    });

    it('should return null when session has no user', async () => {
      mockAuth.mockResolvedValue({} as any);

      const context = await requireAuth();

      expect(context).toBeNull();
    });
  });

  describe('requireRole', () => {
    it('should return context when user has allowed role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'admin',
          username: 'admin',
        },
      } as any);

      const context = await requireRole(['admin', 'agent']);

      expect(context).not.toBeNull();
      expect(context?.role).toBe('admin');
    });

    it('should return null when user does not have allowed role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
        },
      } as any);

      const context = await requireRole(['admin']);

      expect(context).toBeNull();
    });

    it('should return null when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const context = await requireRole(['admin']);

      expect(context).toBeNull();
    });
  });

  describe('requirePermission', () => {
    it('should return context when user has permission', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
        },
      } as any);

      const context = await requirePermission('view:dashboard');

      expect(context).not.toBeNull();
      expect(context?.role).toBe('client');
    });

    it('should return null when user does not have permission', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'hands-off',
        },
      } as any);

      const context = await requirePermission('view:dashboard');

      expect(context).toBeNull();
    });

    it('should return context for admin with any permission', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          role: 'admin',
        },
      } as any);

      const context = await requirePermission('manage:system');

      expect(context).not.toBeNull();
      expect(context?.role).toBe('admin');
    });
  });

  describe('withAuth', () => {
    it('should call handler when user is authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
        },
      } as any);

      const handler = jest.fn(async (req: NextRequest, context: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const wrapped = withAuth(handler);
      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrapped(request);

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const handler = jest.fn();
      const wrapped = withAuth(handler);
      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrapped(request);
      const data = await response.json();

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('withRole', () => {
    it('should call handler when user has allowed role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          role: 'admin',
        },
      } as any);

      const handler = jest.fn(async (req: NextRequest, context: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const wrapped = withRole(['admin'], handler);
      const request = new NextRequest('http://localhost:3000/api/admin');

      const response = await wrapped(request);

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 403 when user does not have allowed role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
        },
      } as any);

      const handler = jest.fn();
      const wrapped = withRole(['admin'], handler);
      const request = new NextRequest('http://localhost:3000/api/admin');

      const response = await wrapped(request);
      const data = await response.json();

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });
  });

  describe('withPermission', () => {
    it('should call handler when user has permission', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'self-service',
        },
      } as any);

      const handler = jest.fn(async (req: NextRequest, context: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const wrapped = withPermission('view:dashboard', handler);
      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await wrapped(request);

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 403 when user does not have permission', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'client',
          accessMode: 'hands-off',
        },
      } as any);

      const handler = jest.fn();
      const wrapped = withPermission('view:dashboard', handler);
      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await wrapped(request);
      const data = await response.json();

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });
  });
});

