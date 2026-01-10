/**
 * Unit tests for RouteGuard component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RouteGuard from '@/components/auth/route-guard';
import { usePermissions } from '@/lib/hooks/usePermissions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

describe('RouteGuard', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Authentication checks', () => {
    it('should redirect to login when not authenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/login',
      });

      render(
        <RouteGuard requiredPermission="view:dashboard">
          <div>Protected Content</div>
        </RouteGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state while session is loading', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/login',
      });

      render(
        <RouteGuard requiredPermission="view:dashboard">
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Permission checks', () => {
    it('should render children when user has required permission', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client', accessMode: 'self-service' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => true,
        canAccessRoute: () => true,
        getDefaultRoute: () => '/dashboard',
        role: 'client',
        accessMode: 'self-service',
      });

      render(
        <RouteGuard requiredPermission="view:dashboard">
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect when user lacks required permission', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client', accessMode: 'hands-off' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/messages',
        role: 'client',
        accessMode: 'hands-off',
      });

      render(
        <RouteGuard requiredPermission="view:dashboard">
          <div>Protected Content</div>
        </RouteGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/messages');
      });
    });
  });

  describe('Role restrictions', () => {
    it('should render children when user has allowed role', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => true,
        canAccessRoute: () => true,
        getDefaultRoute: () => '/admin',
        role: 'admin',
      });

      render(
        <RouteGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RouteGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should redirect when user does not have allowed role', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/dashboard',
        role: 'client',
      });

      render(
        <RouteGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RouteGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Access mode restrictions', () => {
    it('should render children when user has allowed access mode', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client', accessMode: 'self-service' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => true,
        canAccessRoute: () => true,
        getDefaultRoute: () => '/dashboard',
        role: 'client',
        accessMode: 'self-service',
      });

      render(
        <RouteGuard allowedAccessModes={['self-service']}>
          <div>Self-Service Content</div>
        </RouteGuard>
      );

      expect(screen.getByText('Self-Service Content')).toBeInTheDocument();
    });

    it('should redirect when user does not have allowed access mode', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client', accessMode: 'hands-off' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/messages',
        role: 'client',
        accessMode: 'hands-off',
      });

      render(
        <RouteGuard allowedAccessModes={['self-service']}>
          <div>Self-Service Content</div>
        </RouteGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/messages');
      });
    });
  });

  describe('Custom fallback and redirect', () => {
    it('should show custom fallback when provided', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/login',
      });

      render(
        <RouteGuard 
          requiredPermission="view:dashboard"
          fallback={<div>Custom Loading...</div>}
        >
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should use custom redirect URL when provided', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasPermission: () => false,
        canAccessRoute: () => false,
        getDefaultRoute: () => '/dashboard',
        role: 'client',
      });

      render(
        <RouteGuard 
          requiredPermission="view:admin"
          redirectTo="/custom-redirect"
        >
          <div>Admin Content</div>
        </RouteGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
      });
    });
  });
});

