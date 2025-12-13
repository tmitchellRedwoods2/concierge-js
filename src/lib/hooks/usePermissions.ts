/**
 * React Hook for Role-Based Permissions
 * 
 * Provides client-side access to user permissions and role-based UI controls.
 */

'use client';

import { useSession } from 'next-auth/react';
import { UserRole, AccessMode } from '@/lib/db/models/User';
import { hasPermission, canAccessRoute, getUserPermissions, getDefaultRoute, Permission } from '@/lib/auth/permissions';
import { useMemo } from 'react';

export function usePermissions() {
  const { data: session, status } = useSession();
  
  const role = (session?.user?.role as UserRole) || 'client';
  const accessMode = (session?.user?.accessMode as AccessMode | undefined);
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const permissions = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }
    return getUserPermissions(role, accessMode);
  }, [isAuthenticated, role, accessMode]);

  const checkPermission = useMemo(() => {
    return (permission: Permission) => {
      if (!isAuthenticated) {
        return false;
      }
      return hasPermission(role, permission, accessMode);
    };
  }, [isAuthenticated, role, accessMode]);

  const checkRouteAccess = useMemo(() => {
    return (route: string) => {
      if (!isAuthenticated) {
        return false;
      }
      return canAccessRoute(role, route, accessMode);
    };
  }, [isAuthenticated, role, accessMode]);

  const defaultRoute = useMemo(() => {
    if (!isAuthenticated) {
      return '/login';
    }
    return getDefaultRoute(role, accessMode);
  }, [isAuthenticated, role, accessMode]);

  return {
    // User info
    role,
    accessMode,
    isAuthenticated,
    isLoading,
    userId: session?.user?.id,
    username: session?.user?.username,
    plan: session?.user?.plan,
    
    // Permissions
    permissions,
    hasPermission: checkPermission,
    canAccessRoute: checkRouteAccess,
    defaultRoute,
    
    // Role checks
    isClient: role === 'client',
    isAdmin: role === 'admin',
    isAgent: role === 'agent',
    
    // Access mode checks (for clients)
    isHandsOff: role === 'client' && accessMode === 'hands-off',
    isSelfService: role === 'client' && accessMode === 'self-service',
    isAIOnly: role === 'client' && accessMode === 'ai-only',
  };
}

