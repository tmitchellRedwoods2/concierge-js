/**
 * Role-Based Access Control (RBAC) Permissions System
 * 
 * Defines permissions for different user roles and access modes.
 * This system controls what users can see and do based on their role
 * and access mode (for clients).
 */

import { UserRole, AccessMode } from '@/lib/db/models/User';

export type Permission = 
  | 'view:dashboard'
  | 'view:calendar'
  | 'view:expenses'
  | 'view:investments'
  | 'view:health'
  | 'view:insurance'
  | 'view:legal'
  | 'view:tax'
  | 'view:travel'
  | 'view:messages'
  | 'view:settings'
  | 'view:admin'
  | 'view:workflows'
  | 'edit:calendar'
  | 'edit:expenses'
  | 'edit:investments'
  | 'edit:health'
  | 'edit:insurance'
  | 'edit:legal'
  | 'edit:tax'
  | 'edit:travel'
  | 'edit:settings'
  | 'edit:users'
  | 'edit:system'
  | 'use:ai-chat'
  | 'use:automation'
  | 'manage:clients'
  | 'manage:agents'
  | 'view:reports'
  | 'manage:system';

/**
 * Permission matrix: Maps roles and access modes to their allowed permissions
 */
const PERMISSIONS: Record<UserRole, Record<AccessMode | 'default', Permission[]>> = {
  client: {
    'hands-off': [
      'view:messages',
      'use:ai-chat',
      'view:reports',
    ],
    'self-service': [
      'view:dashboard',
      'view:calendar',
      'view:expenses',
      'view:investments',
      'view:health',
      'view:insurance',
      'view:legal',
      'view:tax',
      'view:travel',
      'view:messages',
      'view:settings',
      'view:workflows',
      'edit:calendar',
      'edit:expenses',
      'edit:investments',
      'edit:health',
      'edit:insurance',
      'edit:legal',
      'edit:tax',
      'edit:travel',
      'edit:settings',
      'use:ai-chat',
      'use:automation',
      'view:reports',
    ],
    'ai-only': [
      'view:messages',
      'use:ai-chat',
      'view:reports',
    ],
    default: [],
  },
  admin: {
    default: [
      'view:dashboard',
      'view:calendar',
      'view:expenses',
      'view:investments',
      'view:health',
      'view:insurance',
      'view:legal',
      'view:tax',
      'view:travel',
      'view:messages',
      'view:settings',
      'view:admin',
      'view:workflows',
      'view:reports',
      'edit:calendar',
      'edit:expenses',
      'edit:investments',
      'edit:health',
      'edit:insurance',
      'edit:legal',
      'edit:tax',
      'edit:travel',
      'edit:settings',
      'edit:users',
      'edit:system',
      'use:ai-chat',
      'use:automation',
      'manage:clients',
      'manage:agents',
      'manage:system',
    ],
  },
  agent: {
    default: [
      'view:calendar',
      'view:expenses',
      'view:investments',
      'view:health',
      'view:insurance',
      'view:legal',
      'view:tax',
      'view:travel',
      'edit:calendar',
      'edit:expenses',
      'edit:investments',
      'edit:health',
      'edit:insurance',
      'edit:legal',
      'edit:tax',
      'edit:travel',
      'use:automation',
    ],
  },
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: Permission,
  accessMode?: AccessMode
): boolean {
  const rolePermissions = PERMISSIONS[role];
  
  if (!rolePermissions) {
    return false;
  }

  // For clients, check access mode specific permissions
  if (role === 'client' && accessMode) {
    const modePermissions = rolePermissions[accessMode] || [];
    return modePermissions.includes(permission);
  }

  // For admin and agent, use default permissions
  const defaultPermissions = rolePermissions.default || [];
  return defaultPermissions.includes(permission);
}

/**
 * Get all permissions for a user based on their role and access mode
 */
export function getUserPermissions(
  role: UserRole,
  accessMode?: AccessMode
): Permission[] {
  const rolePermissions = PERMISSIONS[role];
  
  if (!rolePermissions) {
    return [];
  }

  if (role === 'client' && accessMode) {
    return rolePermissions[accessMode] || [];
  }

  return rolePermissions.default || [];
}

/**
 * Check if user can access a specific route/page
 */
export function canAccessRoute(
  role: UserRole,
  route: string,
  accessMode?: AccessMode
): boolean {
  // Map routes to required permissions
  const routePermissions: Record<string, Permission> = {
    '/dashboard': 'view:dashboard',
    '/calendar': 'view:calendar',
    '/expenses': 'view:expenses',
    '/investments': 'view:investments',
    '/health': 'view:health',
    '/insurance': 'view:insurance',
    '/legal': 'view:legal',
    '/tax': 'view:tax',
    '/travel': 'view:travel',
    '/messages': 'view:messages',
    '/settings': 'view:settings',
    '/admin': 'view:admin',
    '/workflows': 'view:workflows',
  };

  const requiredPermission = routePermissions[route];
  
  if (!requiredPermission) {
    // Unknown routes are allowed by default (can be restricted later)
    return true;
  }

  return hasPermission(role, requiredPermission, accessMode);
}

/**
 * Get the default route for a user based on their role and access mode
 */
export function getDefaultRoute(role: UserRole, accessMode?: AccessMode): string {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'client') {
    if (accessMode === 'hands-off' || accessMode === 'ai-only') {
      return '/messages'; // AI chat interface
    }
    return '/dashboard'; // Full self-service dashboard
  }

  if (role === 'agent') {
    return '/workflows'; // Agent workflow management
  }

  return '/dashboard';
}

