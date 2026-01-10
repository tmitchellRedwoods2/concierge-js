/**
 * Role-Based Access Control Middleware
 * 
 * Protects routes based on user roles and permissions.
 * Use this middleware in API routes and page components to enforce access control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, AccessMode } from '@/lib/db/models/User';
import { hasPermission, canAccessRoute, Permission } from './permissions';

export interface AuthContext {
  userId: string;
  role: UserRole;
  accessMode?: AccessMode;
  username?: string;
  plan?: string;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(): Promise<AuthContext | null> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    role: (session.user.role as UserRole) || 'client',
    accessMode: session.user.accessMode as AccessMode | undefined,
    username: session.user.username,
    plan: session.user.plan,
  };
}

/**
 * Middleware to require a specific role
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext | null> {
  const authContext = await requireAuth();
  
  if (!authContext) {
    return null;
  }

  if (!allowedRoles.includes(authContext.role)) {
    return null;
  }

  return authContext;
}

/**
 * Middleware to require a specific permission
 */
export async function requirePermission(permission: Permission): Promise<AuthContext | null> {
  const authContext = await requireAuth();
  
  if (!authContext) {
    return null;
  }

  if (!hasPermission(authContext.role, permission, authContext.accessMode)) {
    return null;
  }

  return authContext;
}

/**
 * API route wrapper that requires authentication
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authContext = await requireAuth();
    
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, authContext);
  };
}

/**
 * API route wrapper that requires a specific role
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authContext = await requireRole(allowedRoles);
    
    if (!authContext) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, authContext);
  };
}

/**
 * API route wrapper that requires a specific permission
 */
export function withPermission(
  permission: Permission,
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authContext = await requirePermission(permission);
    
    if (!authContext) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, authContext);
  };
}

/**
 * Check if user can access a route (for client-side use)
 */
export async function checkRouteAccess(route: string): Promise<boolean> {
  const authContext = await requireAuth();
  
  if (!authContext) {
    return false;
  }

  return canAccessRoute(authContext.role, route, authContext.accessMode);
}

