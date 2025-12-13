# Role-Based Authentication System

## Overview

This document describes the role-based authentication (RBAC) system implemented for the Concierge.js family office platform. The system supports three user roles with different access modes, enabling a flexible experience for clients ranging from hands-off to full self-service.

## Architecture

### User Roles

1. **Client** - End users (family office clients)
   - Can have different access modes (see below)
   - Default role for new users

2. **Admin** - Internal staff managing clients
   - Full system access
   - Client management capabilities
   - System configuration access

3. **Agent** - AI agents (system accounts)
   - Automated task execution
   - Background processing
   - No UI access

### Client Access Modes

Clients can have one of three access modes:

1. **Hands-Off Mode** (`hands-off`)
   - Minimal UI access
   - Agents handle everything automatically
   - Users can view messages and reports
   - AI chat interface available

2. **Self-Service Mode** (`self-service`)
   - Full dashboard access
   - All service management capabilities
   - Complete control over their data
   - Default mode for new clients

3. **AI-Only Mode** (`ai-only`)
   - Chat interface only
   - All interactions through AI agents
   - No direct access to service management
   - Reports and messages available

## Implementation Details

### Database Schema

The `User` model has been extended with:

```typescript
role: UserRole; // 'client' | 'admin' | 'agent'
accessMode?: AccessMode; // 'hands-off' | 'self-service' | 'ai-only' (only for clients)
```

**Schema Validation:**
- `role` is required for all users
- `accessMode` is only applicable for clients
- Default `role`: `'client'`
- Default `accessMode`: `'self-service'`

### Permissions System

Located in: `src/lib/auth/permissions.ts`

**Permission Types:**
- `view:*` - View access to various sections
- `edit:*` - Edit access to various sections
- `use:*` - Use specific features (AI chat, automation)
- `manage:*` - Administrative management capabilities

**Permission Matrix:**

| Role | Access Mode | Permissions |
|------|-------------|-------------|
| Client | hands-off | Messages, AI Chat, Reports |
| Client | self-service | Full dashboard, all services, AI chat, automation |
| Client | ai-only | Messages, AI Chat, Reports |
| Admin | default | All permissions (full system access) |
| Agent | default | Service editing, automation (no UI) |

### Middleware

Located in: `src/lib/auth/middleware.ts`

**Available Middleware Functions:**

1. `requireAuth()` - Requires authentication
2. `requireRole(allowedRoles)` - Requires specific role(s)
3. `requirePermission(permission)` - Requires specific permission
4. `withAuth(handler)` - API route wrapper for authentication
5. `withRole(allowedRoles, handler)` - API route wrapper for role check
6. `withPermission(permission, handler)` - API route wrapper for permission check

**Usage Example:**

```typescript
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole(['admin'], async (req, context) => {
  // context contains: userId, role, accessMode, username, plan
  // Only admins can access this route
  return NextResponse.json({ data: 'admin only' });
});
```

### Client-Side Hook

Located in: `src/lib/hooks/usePermissions.ts`

**Usage Example:**

```typescript
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';

export default function MyComponent() {
  const { 
    hasPermission, 
    canAccessRoute, 
    isAdmin, 
    isSelfService,
    defaultRoute 
  } = usePermissions();

  if (!hasPermission('view:dashboard')) {
    return <div>Access Denied</div>;
  }

  return <div>Dashboard Content</div>;
}
```

**Available Properties:**
- `role` - User's role
- `accessMode` - User's access mode (if client)
- `isAuthenticated` - Authentication status
- `permissions` - Array of all user permissions
- `hasPermission(permission)` - Check specific permission
- `canAccessRoute(route)` - Check route access
- `defaultRoute` - User's default route
- `isClient`, `isAdmin`, `isAgent` - Role checks
- `isHandsOff`, `isSelfService`, `isAIOnly` - Access mode checks

## Session Management

The NextAuth session has been extended to include:
- `user.role` - User's role
- `user.accessMode` - User's access mode (if client)

These are automatically included in the JWT token and session object.

## Default Routes

Based on role and access mode:

- **Admin**: `/admin`
- **Client (self-service)**: `/dashboard`
- **Client (hands-off/ai-only)**: `/messages`
- **Agent**: `/workflows`

## Migration Guide

### For Existing Users

Existing users will automatically get:
- `role: 'client'`
- `accessMode: 'self-service'`

No migration script is needed as defaults are set in the schema.

### For New Users

New users created through signup will have:
- `role: 'client'` (default)
- `accessMode: 'self-service'` (default)

Admins can change these through the admin interface (to be implemented).

## API Route Protection Examples

### Example 1: Admin Only Route

```typescript
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole(['admin'], async (req, context) => {
  // Only admins can access
  return NextResponse.json({ message: 'Admin data' });
});
```

### Example 2: Permission-Based Route

```typescript
import { withPermission } from '@/lib/auth/middleware';

export const POST = withPermission('edit:calendar', async (req, context) => {
  // Only users with edit:calendar permission can access
  const body = await req.json();
  // Create calendar event...
  return NextResponse.json({ success: true });
});
```

### Example 3: Custom Auth Check

```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const authContext = await requireAuth();
  
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Custom logic based on role/accessMode
  if (authContext.role === 'client' && authContext.accessMode === 'hands-off') {
    // Limited access logic
  }

  return NextResponse.json({ data: 'success' });
}
```

## Client-Side Route Protection

### Example: Conditional Rendering

```typescript
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { canAccessRoute, defaultRoute, isSelfService } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessRoute('/dashboard')) {
      router.push(defaultRoute);
    }
  }, [canAccessRoute, defaultRoute, router]);

  if (!isSelfService) {
    return <div>Limited access mode</div>;
  }

  return <div>Full dashboard</div>;
}
```

## Testing

### Unit Tests

Test files should be created for:
- `src/__tests__/lib/auth/permissions.test.ts`
- `src/__tests__/lib/auth/middleware.test.ts`
- `src/__tests__/lib/hooks/usePermissions.test.ts`

### Test Scenarios

1. **Permission Checks**
   - Verify correct permissions for each role/access mode combination
   - Verify permission denial for unauthorized access

2. **Route Protection**
   - Verify middleware blocks unauthorized access
   - Verify correct status codes (401, 403)

3. **Session Management**
   - Verify role and accessMode are included in session
   - Verify JWT token contains correct data

## Future Enhancements

1. **Role Management UI**
   - Admin interface to change user roles
   - Admin interface to change client access modes
   - Bulk role updates

2. **Granular Permissions**
   - Per-service permissions
   - Custom permission sets
   - Permission inheritance

3. **Audit Logging**
   - Track permission checks
   - Log access attempts
   - Security monitoring

## Files Created/Modified

### Created Files:
- `src/lib/auth/permissions.ts` - Permissions system
- `src/lib/auth/middleware.ts` - Route protection middleware
- `src/lib/hooks/usePermissions.ts` - React hook for permissions
- `ROLE_BASED_AUTHENTICATION.md` - This documentation

### Modified Files:
- `src/lib/db/models/User.ts` - Added role and accessMode fields
- `src/lib/auth.ts` - Added role and accessMode to session

## Next Steps

1. **Create Role-Specific Dashboards**
   - Hands-off dashboard (minimal UI)
   - Self-service dashboard (full features)
   - AI-only interface (chat-focused)
   - Admin dashboard

2. **Implement Role Management UI**
   - Admin panel for user management
   - Role assignment interface
   - Access mode configuration

3. **Add Route Guards**
   - Protect all routes with appropriate middleware
   - Add client-side route guards
   - Implement redirect logic

4. **Testing**
   - Write comprehensive unit tests
   - Add integration tests
   - Test all role/access mode combinations

## Support

For questions or issues with the RBAC system, refer to:
- This documentation
- Code comments in implementation files
- Test files for usage examples

