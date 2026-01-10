# Route Guards Implementation

## Overview

This document describes the route guard system implemented for the Concierge.js application. Route guards ensure that users can only access pages and API endpoints they have permission to use based on their role and access mode.

## Implementation Status

### ✅ Completed

1. **Next.js Middleware** (`src/middleware.ts`)
   - Edge-level route protection
   - Authentication checks
   - Basic role-based redirects
   - Public route whitelist

2. **RouteGuard Component** (`src/components/auth/route-guard.tsx`)
   - Client-side route protection component
   - Permission-based access control
   - Role and access mode restrictions
   - Automatic redirects

3. **Route Configuration** (`src/lib/auth/route-config.ts`)
   - Centralized route permission definitions
   - Route-to-permission mapping
   - Access mode restrictions

4. **Pages with Route Guards Applied**
   - ✅ `/admin` - Admin dashboard
   - ✅ `/admin/users` - User management
   - ✅ `/admin/users/new` - Create user
   - ✅ `/admin/users/[userId]/edit` - Edit user
   - ✅ `/dashboard` - Main dashboard (self-service only)
   - ✅ `/calendar` - Calendar view
   - ✅ `/workflows` - Workflow management

### ⏳ Pending

The following pages still need RouteGuard applied:

#### Service Pages (Self-Service Only)
- `/health` - Health management
- `/investments` - Investment tracking
- `/expenses` - Expense management
- `/insurance` - Insurance management
- `/legal` - Legal services
- `/tax` - Tax management
- `/travel` - Travel planning

#### Settings Pages
- `/settings` - General settings
- `/settings/calendar` - Calendar settings
- `/settings/calendar/apple` - Apple Calendar settings
- `/settings/email-scanning` - Email scanning settings

#### Other Pages
- `/messages` - Messaging (available to all authenticated users)
- `/calendar/event/[eventId]` - Event details
- `/test/email-to-calendar` - Test page
- `/test-calendar` - Test calendar page

## Usage

### Applying RouteGuard to a Page

```tsx
'use client';

import RouteGuard from '@/components/auth/route-guard';

export default function MyPage() {
  return (
    <RouteGuard 
      requiredPermission="view:dashboard"
      allowedAccessModes={['self-service']}
    >
      <div>
        {/* Page content */}
      </div>
    </RouteGuard>
  );
}
```

### RouteGuard Props

- `requiredPermission?: Permission` - Required permission to access the page
- `allowedRoles?: ('client' | 'admin' | 'agent')[]` - Allowed user roles
- `allowedAccessModes?: ('hands-off' | 'self-service' | 'ai-only')[]` - Allowed access modes (for clients)
- `fallback?: React.ReactNode` - Custom loading/denied message
- `redirectTo?: string` - Custom redirect URL (defaults to user's default route)

### Route Configuration

Routes are defined in `src/lib/auth/route-config.ts`:

```typescript
{
  path: '/dashboard',
  permission: 'view:dashboard',
  allowedAccessModes: ['self-service']
}
```

## Permission Requirements

### Dashboard Routes
- `/dashboard` - `view:dashboard` (self-service only)

### Calendar Routes
- `/calendar` - `view:calendar`
- `/calendar/event/[eventId]` - `view:calendar`
- `/settings/calendar` - `edit:calendar`
- `/settings/calendar/apple` - `edit:calendar`

### Service Routes (Self-Service Only)
- `/health` - `view:health`
- `/investments` - `view:investments`
- `/expenses` - `view:expenses`
- `/insurance` - `view:insurance`
- `/legal` - `view:legal`
- `/tax` - `view:tax`
- `/travel` - `view:travel`

### Admin Routes
- `/admin` - `view:admin` (admin only)
- `/admin/users` - `manage:users` (admin only)
- `/admin/users/new` - `manage:users` (admin only)
- `/admin/users/[userId]` - `manage:users` (admin only)
- `/admin/users/[userId]/edit` - `manage:users` (admin only)

### Workflow Routes
- `/workflows` - `manage:automation`

### Email Scanning
- `/settings/email-scanning` - `view:email-scanning`

### Messages
- `/messages` - `view:messages` (available to all authenticated users)

## Access Mode Restrictions

### Hands-Off Clients
- ✅ `/messages` - Can view messages
- ✅ `/calendar` - Can view calendar
- ❌ `/dashboard` - No access (redirected to `/messages`)
- ❌ All service pages - No access

### Self-Service Clients
- ✅ Full access to all pages they have permissions for
- ✅ `/dashboard` - Full dashboard access
- ✅ All service pages

### AI-Only Clients
- ✅ `/messages` - Can view messages
- ❌ All other pages - No access (redirected to `/messages`)

### Admins
- ✅ Full access to all pages
- ✅ `/admin` - Admin dashboard
- ✅ All user management pages

### Agents
- ✅ `/workflows` - Workflow management
- ✅ Service editing capabilities (via API)
- ❌ UI pages (no UI access)

## Next Steps

1. **Apply RouteGuard to Remaining Pages**
   - Service pages (health, investments, expenses, etc.)
   - Settings pages
   - Test pages (optional)

2. **API Route Protection**
   - Most API routes already use `withRole` or `withPermission` middleware
   - Verify all API routes are properly protected
   - Add permission checks where needed

3. **Testing**
   - Create integration tests for route guards
   - Test all role/access mode combinations
   - Verify redirects work correctly

4. **Documentation**
   - Update API documentation with permission requirements
   - Create user guide for access modes

## Files Modified

- `src/middleware.ts` - Next.js edge middleware
- `src/components/auth/route-guard.tsx` - Route guard component
- `src/lib/auth/route-config.ts` - Route configuration
- `src/app/dashboard/page.tsx` - Added RouteGuard
- `src/app/calendar/page.tsx` - Added RouteGuard
- `src/app/workflows/page.tsx` - Added RouteGuard
- `src/app/admin/page.tsx` - Already has permission checks

## Testing

To test route guards:

1. **Test as Hands-Off Client**
   - Should only access `/messages` and `/calendar`
   - Should be redirected from `/dashboard` and service pages

2. **Test as Self-Service Client**
   - Should access all pages with appropriate permissions
   - Should access `/dashboard` and all service pages

3. **Test as AI-Only Client**
   - Should only access `/messages`
   - Should be redirected from all other pages

4. **Test as Admin**
   - Should access all pages including `/admin`
   - Should access user management pages

5. **Test as Unauthenticated User**
   - Should be redirected to `/login` from all protected pages

