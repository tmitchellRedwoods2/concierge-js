/**
 * Route Guard Component
 * Client-side route protection based on permissions
 * Use this component to wrap protected pages
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Permission } from '@/lib/auth/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  allowedRoles?: ('client' | 'admin' | 'agent')[];
  allowedAccessModes?: ('hands-off' | 'self-service' | 'ai-only')[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function RouteGuard({
  children,
  requiredPermission,
  allowedRoles,
  allowedAccessModes,
  fallback,
  redirectTo,
}: RouteGuardProps) {
  const { data: session, status } = useSession();
  const { hasPermission, canAccessRoute, getDefaultRoute, isAdmin, role, accessMode } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    // Not authenticated
    if (!session) {
      router.push('/login');
      return;
    }

    // Check role restrictions
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push(redirectTo || getDefaultRoute());
      return;
    }

    // Check access mode restrictions
    if (allowedAccessModes && accessMode && !allowedAccessModes.includes(accessMode)) {
      router.push(redirectTo || getDefaultRoute());
      return;
    }

    // Check permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(redirectTo || getDefaultRoute());
      return;
    }
  }, [session, status, requiredPermission, allowedRoles, allowedAccessModes, hasPermission, role, accessMode, router, getDefaultRoute, redirectTo]);

  // Show loading state
  if (status === 'loading') {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Not authenticated
  if (!session) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  // Check role restrictions
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Access denied...</div>;
  }

  // Check access mode restrictions
  if (allowedAccessModes && accessMode && !allowedAccessModes.includes(accessMode)) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Access denied. This page requires a different access mode.</div>;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Access denied...</div>;
  }

  // All checks passed
  return <>{children}</>;
}

