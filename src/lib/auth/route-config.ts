/**
 * Route Configuration
 * Defines permissions and access rules for all routes
 */
import { Permission } from './permissions';

export interface RouteConfig {
  path: string;
  permission?: Permission;
  allowedRoles?: ('client' | 'admin' | 'agent')[];
  allowedAccessModes?: ('hands-off' | 'self-service' | 'ai-only')[];
  public?: boolean;
}

export const routeConfigs: RouteConfig[] = [
  // Public routes
  { path: '/', public: true },
  { path: '/login', public: true },
  { path: '/signup', public: true },
  
  // Admin routes
  { path: '/admin', permission: 'view:admin', allowedRoles: ['admin'] },
  { path: '/admin/users', permission: 'manage:users', allowedRoles: ['admin'] },
  { path: '/admin/users/new', permission: 'manage:users', allowedRoles: ['admin'] },
  { path: '/admin/users/[userId]', permission: 'manage:users', allowedRoles: ['admin'] },
  { path: '/admin/users/[userId]/edit', permission: 'manage:users', allowedRoles: ['admin'] },
  
  // Dashboard - self-service only
  { 
    path: '/dashboard', 
    permission: 'view:dashboard',
    allowedAccessModes: ['self-service']
  },
  
  // Calendar
  { path: '/calendar', permission: 'view:calendar' },
  { path: '/calendar/event/[eventId]', permission: 'view:calendar' },
  
  // Settings
  { path: '/settings', permission: 'view:calendar' }, // General settings
  { path: '/settings/calendar', permission: 'edit:calendar' },
  { path: '/settings/calendar/apple', permission: 'edit:calendar' },
  { path: '/settings/email-scanning', permission: 'view:email-scanning' },
  
  // Messages - available to all authenticated users
  { path: '/messages', permission: 'view:messages' },
  
  // Service pages - self-service only
  { 
    path: '/health', 
    permission: 'view:health',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/investments', 
    permission: 'view:investments',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/expenses', 
    permission: 'view:expenses',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/insurance', 
    permission: 'view:insurance',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/legal', 
    permission: 'view:legal',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/tax', 
    permission: 'view:tax',
    allowedAccessModes: ['self-service']
  },
  { 
    path: '/travel', 
    permission: 'view:travel',
    allowedAccessModes: ['self-service']
  },
  
  // Workflows - requires automation permission
  { path: '/workflows', permission: 'manage:automation' },
  
  // Test pages (can be public or restricted)
  { path: '/test/email-to-calendar', permission: 'view:calendar' },
  { path: '/test-calendar', permission: 'view:calendar' },
];

/**
 * Get route configuration for a given path
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Exact match first
  const exactMatch = routeConfigs.find(config => config.path === path);
  if (exactMatch) return exactMatch;
  
  // Pattern match for dynamic routes
  for (const config of routeConfigs) {
    if (config.path.includes('[') && config.path.includes(']')) {
      // Convert pattern to regex
      const pattern = config.path
        .replace(/\[([^\]]+)\]/g, '[^/]+')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) {
        return config;
      }
    }
  }
  
  return undefined;
}

/**
 * Check if a route is public
 */
export function isPublicRoute(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.public === true;
}

