/**
 * Unit Tests for usePermissions Hook
 * Tests the React hook for client-side permission checks
 */

/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/lib/hooks/usePermissions';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Self-Service', () => {
    it('should return correct permissions for self-service client', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            role: 'client',
            accessMode: 'self-service',
            username: 'testuser',
            plan: 'premium',
          },
        },
        status: 'authenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('client');
      expect(result.current.accessMode).toBe('self-service');
      expect(result.current.isClient).toBe(true);
      expect(result.current.isSelfService).toBe(true);
      expect(result.current.isHandsOff).toBe(false);
      expect(result.current.isAIOnly).toBe(false);
      expect(result.current.hasPermission('view:dashboard')).toBe(true);
      expect(result.current.hasPermission('edit:calendar')).toBe(true);
      expect(result.current.canAccessRoute('/dashboard')).toBe(true);
      expect(result.current.defaultRoute).toBe('/dashboard');
    });
  });

  describe('Client Hands-Off', () => {
    it('should return correct permissions for hands-off client', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            role: 'client',
            accessMode: 'hands-off',
            username: 'testuser',
            plan: 'premium',
          },
        },
        status: 'authenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('client');
      expect(result.current.accessMode).toBe('hands-off');
      expect(result.current.isClient).toBe(true);
      expect(result.current.isHandsOff).toBe(true);
      expect(result.current.isSelfService).toBe(false);
      expect(result.current.isAIOnly).toBe(false);
      expect(result.current.hasPermission('view:dashboard')).toBe(false);
      expect(result.current.hasPermission('view:messages')).toBe(true);
      expect(result.current.hasPermission('use:ai-chat')).toBe(true);
      expect(result.current.canAccessRoute('/dashboard')).toBe(false);
      expect(result.current.canAccessRoute('/messages')).toBe(true);
      expect(result.current.defaultRoute).toBe('/messages');
    });
  });

  describe('Client AI-Only', () => {
    it('should return correct permissions for ai-only client', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            role: 'client',
            accessMode: 'ai-only',
            username: 'testuser',
            plan: 'premium',
          },
        },
        status: 'authenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('client');
      expect(result.current.accessMode).toBe('ai-only');
      expect(result.current.isClient).toBe(true);
      expect(result.current.isAIOnly).toBe(true);
      expect(result.current.isHandsOff).toBe(false);
      expect(result.current.isSelfService).toBe(false);
      expect(result.current.hasPermission('view:dashboard')).toBe(false);
      expect(result.current.hasPermission('view:messages')).toBe(true);
      expect(result.current.hasPermission('use:ai-chat')).toBe(true);
      expect(result.current.defaultRoute).toBe('/messages');
    });
  });

  describe('Admin', () => {
    it('should return correct permissions for admin', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            role: 'admin',
            username: 'admin',
            plan: 'elite',
          },
        },
        status: 'authenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isClient).toBe(false);
      expect(result.current.isAgent).toBe(false);
      expect(result.current.hasPermission('view:dashboard')).toBe(true);
      expect(result.current.hasPermission('view:admin')).toBe(true);
      expect(result.current.hasPermission('manage:system')).toBe(true);
      expect(result.current.canAccessRoute('/admin')).toBe(true);
      expect(result.current.defaultRoute).toBe('/admin');
    });
  });

  describe('Agent', () => {
    it('should return correct permissions for agent', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'agent-123',
            role: 'agent',
            username: 'agent',
          },
        },
        status: 'authenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('agent');
      expect(result.current.isAgent).toBe(true);
      expect(result.current.isClient).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.hasPermission('edit:calendar')).toBe(true);
      expect(result.current.hasPermission('use:automation')).toBe(true);
      expect(result.current.hasPermission('view:dashboard')).toBe(false);
      expect(result.current.defaultRoute).toBe('/workflows');
    });
  });

  describe('Unauthenticated', () => {
    it('should return unauthenticated state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.role).toBe('client'); // Default
      expect(result.current.hasPermission('view:dashboard')).toBe(false);
      expect(result.current.canAccessRoute('/dashboard')).toBe(false);
      expect(result.current.defaultRoute).toBe('/login');
    });
  });

  describe('Loading State', () => {
    it('should return loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

