/**
 * Unit tests for Role-Based Permissions System
 */

/**
 * @jest-environment node
 */

import {
  hasPermission,
  getUserPermissions,
  canAccessRoute,
  getDefaultRoute,
  Permission,
} from '@/lib/auth/permissions';
import { UserRole, AccessMode } from '@/lib/db/models/User';

describe('Permissions System', () => {
  describe('hasPermission', () => {
    describe('Client Role', () => {
      it('should grant hands-off permissions for hands-off mode', () => {
        expect(hasPermission('client', 'view:messages', 'hands-off')).toBe(true);
        expect(hasPermission('client', 'use:ai-chat', 'hands-off')).toBe(true);
        expect(hasPermission('client', 'view:reports', 'hands-off')).toBe(true);
      });

      it('should deny dashboard access for hands-off mode', () => {
        expect(hasPermission('client', 'view:dashboard', 'hands-off')).toBe(false);
        expect(hasPermission('client', 'edit:calendar', 'hands-off')).toBe(false);
      });

      it('should grant all permissions for self-service mode', () => {
        expect(hasPermission('client', 'view:dashboard', 'self-service')).toBe(true);
        expect(hasPermission('client', 'view:calendar', 'self-service')).toBe(true);
        expect(hasPermission('client', 'edit:calendar', 'self-service')).toBe(true);
        expect(hasPermission('client', 'use:ai-chat', 'self-service')).toBe(true);
        expect(hasPermission('client', 'use:automation', 'self-service')).toBe(true);
      });

      it('should grant ai-only permissions for ai-only mode', () => {
        expect(hasPermission('client', 'view:messages', 'ai-only')).toBe(true);
        expect(hasPermission('client', 'use:ai-chat', 'ai-only')).toBe(true);
        expect(hasPermission('client', 'view:reports', 'ai-only')).toBe(true);
      });

      it('should deny dashboard access for ai-only mode', () => {
        expect(hasPermission('client', 'view:dashboard', 'ai-only')).toBe(false);
        expect(hasPermission('client', 'edit:calendar', 'ai-only')).toBe(false);
      });
    });

    describe('Admin Role', () => {
      it('should grant all permissions to admin', () => {
        expect(hasPermission('admin', 'view:dashboard')).toBe(true);
        expect(hasPermission('admin', 'view:admin')).toBe(true);
        expect(hasPermission('admin', 'edit:users')).toBe(true);
        expect(hasPermission('admin', 'manage:clients')).toBe(true);
        expect(hasPermission('admin', 'manage:system')).toBe(true);
        expect(hasPermission('admin', 'use:ai-chat')).toBe(true);
      });

      it('should ignore accessMode for admin', () => {
        expect(hasPermission('admin', 'view:dashboard', 'hands-off')).toBe(true);
        expect(hasPermission('admin', 'view:dashboard', 'self-service')).toBe(true);
        expect(hasPermission('admin', 'view:dashboard', 'ai-only')).toBe(true);
      });
    });

    describe('Agent Role', () => {
      it('should grant service editing permissions to agent', () => {
        expect(hasPermission('agent', 'edit:calendar')).toBe(true);
        expect(hasPermission('agent', 'edit:expenses')).toBe(true);
        expect(hasPermission('agent', 'use:automation')).toBe(true);
      });

      it('should deny UI access permissions to agent', () => {
        expect(hasPermission('agent', 'view:dashboard')).toBe(false);
        expect(hasPermission('agent', 'view:admin')).toBe(false);
        expect(hasPermission('agent', 'use:ai-chat')).toBe(false);
      });
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid' as UserRole, 'view:dashboard')).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return correct permissions for client hands-off mode', () => {
      const permissions = getUserPermissions('client', 'hands-off');
      expect(permissions).toContain('view:messages');
      expect(permissions).toContain('use:ai-chat');
      expect(permissions).toContain('view:reports');
      expect(permissions).not.toContain('view:dashboard');
    });

    it('should return all permissions for client self-service mode', () => {
      const permissions = getUserPermissions('client', 'self-service');
      expect(permissions.length).toBeGreaterThan(10);
      expect(permissions).toContain('view:dashboard');
      expect(permissions).toContain('edit:calendar');
      expect(permissions).toContain('use:ai-chat');
    });

    it('should return correct permissions for client ai-only mode', () => {
      const permissions = getUserPermissions('client', 'ai-only');
      expect(permissions).toContain('view:messages');
      expect(permissions).toContain('use:ai-chat');
      expect(permissions).not.toContain('view:dashboard');
    });

    it('should return all permissions for admin', () => {
      const permissions = getUserPermissions('admin');
      expect(permissions.length).toBeGreaterThan(20);
      expect(permissions).toContain('view:admin');
      expect(permissions).toContain('manage:system');
    });

    it('should return service permissions for agent', () => {
      const permissions = getUserPermissions('agent');
      expect(permissions).toContain('edit:calendar');
      expect(permissions).toContain('use:automation');
      expect(permissions).not.toContain('view:dashboard');
    });
  });

  describe('canAccessRoute', () => {
    it('should allow client self-service to access dashboard', () => {
      expect(canAccessRoute('client', '/dashboard', 'self-service')).toBe(true);
    });

    it('should deny client hands-off from accessing dashboard', () => {
      expect(canAccessRoute('client', '/dashboard', 'hands-off')).toBe(false);
    });

    it('should allow all clients to access messages', () => {
      expect(canAccessRoute('client', '/messages', 'hands-off')).toBe(true);
      expect(canAccessRoute('client', '/messages', 'self-service')).toBe(true);
      expect(canAccessRoute('client', '/messages', 'ai-only')).toBe(true);
    });

    it('should allow admin to access all routes', () => {
      expect(canAccessRoute('admin', '/dashboard')).toBe(true);
      expect(canAccessRoute('admin', '/admin')).toBe(true);
      expect(canAccessRoute('admin', '/messages')).toBe(true);
    });

    it('should return true for unknown routes (default allow)', () => {
      expect(canAccessRoute('client', '/unknown-route', 'self-service')).toBe(true);
    });
  });

  describe('getDefaultRoute', () => {
    it('should return /admin for admin role', () => {
      expect(getDefaultRoute('admin')).toBe('/admin');
    });

    it('should return /dashboard for client self-service', () => {
      expect(getDefaultRoute('client', 'self-service')).toBe('/dashboard');
    });

    it('should return /messages for client hands-off', () => {
      expect(getDefaultRoute('client', 'hands-off')).toBe('/messages');
    });

    it('should return /messages for client ai-only', () => {
      expect(getDefaultRoute('client', 'ai-only')).toBe('/messages');
    });

    it('should return /workflows for agent role', () => {
      expect(getDefaultRoute('agent')).toBe('/workflows');
    });
  });
});

