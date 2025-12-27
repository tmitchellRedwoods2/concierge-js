# Route Guards & RBAC System Test Plan

## Overview
This document outlines the system test plan for the Route Guards and Role-Based Access Control (RBAC) implementation. The tests verify that users can only access pages and features appropriate for their role and access mode.

## Test Environment Setup

### Prerequisites
1. Application deployed and accessible
2. Test users created with different roles and access modes:
   - Admin user
   - Self-service client
   - Hands-off client
   - AI-only client
   - Agent user (if applicable)

### Test Data
Create the following test users in the admin panel:
- **Admin User**: `admin@test.com` (role: admin)
- **Self-Service Client**: `selfservice@test.com` (role: client, accessMode: self-service)
- **Hands-Off Client**: `handsoff@test.com` (role: client, accessMode: hands-off)
- **AI-Only Client**: `aionly@test.com` (role: client, accessMode: ai-only)

## Test Scenarios

### 1. Authentication & Public Routes

#### Test 1.1: Unauthenticated User Access
**Objective**: Verify unauthenticated users are redirected to login

**Steps**:
1. Log out (or use incognito mode)
2. Navigate to protected routes:
   - `/dashboard`
   - `/calendar`
   - `/admin`
   - `/health`
   - `/messages`

**Expected Results**:
- All protected routes redirect to `/login`
- Login page displays correctly
- After login, user is redirected to appropriate default route

**Status**: ⬜ Not Tested

---

#### Test 1.2: Public Routes Access
**Objective**: Verify public routes are accessible without authentication

**Steps**:
1. Log out
2. Navigate to:
   - `/` (home page)
   - `/login`
   - `/signup`

**Expected Results**:
- All public routes load without redirect
- No authentication errors

**Status**: ⬜ Not Tested

---

### 2. Admin Role Access

#### Test 2.1: Admin Dashboard Access
**Objective**: Verify admin can access admin dashboard

**Steps**:
1. Login as admin user
2. Navigate to `/admin`

**Expected Results**:
- Admin dashboard loads successfully
- User management interface displays
- Can view all users

**Status**: ⬜ Not Tested

---

#### Test 2.2: Admin User Management
**Objective**: Verify admin can manage users

**Steps**:
1. Login as admin
2. Navigate to `/admin/users`
3. Click "Add New User"
4. Create a new user with different roles
5. Edit an existing user
6. Delete a user (not yourself)

**Expected Results**:
- Can create users with all roles
- Can edit user details, roles, and access modes
- Cannot delete own account
- Validation works correctly

**Status**: ⬜ Not Tested

---

#### Test 2.3: Admin Access to All Pages
**Objective**: Verify admin has access to all pages

**Steps**:
1. Login as admin
2. Navigate to all service pages:
   - `/dashboard`
   - `/calendar`
   - `/health`
   - `/investments`
   - `/expenses`
   - `/insurance`
   - `/legal`
   - `/tax`
   - `/travel`
   - `/messages`
   - `/workflows`
   - `/settings`

**Expected Results**:
- All pages load successfully
- No permission denied errors
- Full functionality available

**Status**: ⬜ Not Tested

---

### 3. Self-Service Client Access

#### Test 3.1: Self-Service Dashboard
**Objective**: Verify self-service client sees full dashboard

**Steps**:
1. Login as self-service client
2. Navigate to `/dashboard`

**Expected Results**:
- Full dashboard with all widgets displays
- Financial overview visible
- All service links accessible
- Navigation tabs present

**Status**: ⬜ Not Tested

---

#### Test 3.2: Self-Service Service Pages
**Objective**: Verify self-service client can access all service pages

**Steps**:
1. Login as self-service client
2. Navigate to each service page:
   - `/health`
   - `/investments`
   - `/expenses`
   - `/insurance`
   - `/legal`
   - `/tax`
   - `/travel`

**Expected Results**:
- All service pages load successfully
- Full functionality available
- Can create/edit/delete items

**Status**: ⬜ Not Tested

---

#### Test 3.3: Self-Service Settings Access
**Objective**: Verify self-service client can access settings

**Steps**:
1. Login as self-service client
2. Navigate to:
   - `/settings`
   - `/settings/calendar`
   - `/settings/email-scanning`

**Expected Results**:
- All settings pages load
- Can modify preferences
- Changes save correctly

**Status**: ⬜ Not Tested

---

### 4. Hands-Off Client Access

#### Test 4.1: Hands-Off Dashboard
**Objective**: Verify hands-off client sees minimal dashboard

**Steps**:
1. Login as hands-off client
2. Navigate to `/dashboard`

**Expected Results**:
- Hands-off dashboard displays (not full dashboard)
- Shows AI chat interface prominently
- Recent activity visible
- Quick stats displayed
- Limited navigation options

**Status**: ⬜ Not Tested

---

#### Test 4.2: Hands-Off Service Pages Access
**Objective**: Verify hands-off client cannot access service pages

**Steps**:
1. Login as hands-off client
2. Try to navigate to:
   - `/health`
   - `/investments`
   - `/expenses`
   - `/insurance`
   - `/legal`
   - `/tax`
   - `/travel`

**Expected Results**:
- All service pages redirect to `/messages` or default route
- Cannot access service functionality directly
- Appropriate error message or redirect

**Status**: ⬜ Not Tested

---

#### Test 4.3: Hands-Off Allowed Pages
**Objective**: Verify hands-off client can access allowed pages

**Steps**:
1. Login as hands-off client
2. Navigate to:
   - `/messages`
   - `/calendar`

**Expected Results**:
- Messages page loads successfully
- Calendar page loads successfully
- Can view calendar events
- Can send/receive messages

**Status**: ⬜ Not Tested

---

### 5. AI-Only Client Access

#### Test 5.1: AI-Only Dashboard
**Objective**: Verify AI-only client sees ultra-minimal dashboard

**Steps**:
1. Login as AI-only client
2. Navigate to `/dashboard`

**Expected Results**:
- AI-only dashboard displays
- Only AI chat interface visible
- No service links or navigation
- Focus on messaging

**Status**: ⬜ Not Tested

---

#### Test 5.2: AI-Only Page Restrictions
**Objective**: Verify AI-only client can only access messages

**Steps**:
1. Login as AI-only client
2. Try to navigate to:
   - `/calendar`
   - `/health`
   - `/dashboard`
   - `/settings`
   - Any service page

**Expected Results**:
- All pages except `/messages` redirect to `/messages`
- Cannot access any other functionality
- Appropriate redirect behavior

**Status**: ⬜ Not Tested

---

#### Test 5.3: AI-Only Messages Access
**Objective**: Verify AI-only client can use messages

**Steps**:
1. Login as AI-only client
2. Navigate to `/messages`
3. Send a message
4. View message history

**Expected Results**:
- Messages page loads successfully
- Can send messages
- Can view message history
- AI responses work correctly

**Status**: ⬜ Not Tested

---

### 6. Route Guard Functionality

#### Test 6.1: Direct URL Access
**Objective**: Verify route guards work with direct URL access

**Steps**:
1. Login as different user types
2. Manually type protected URLs in browser
3. Try accessing URLs without proper permissions

**Expected Results**:
- Route guards prevent unauthorized access
- Appropriate redirects occur
- No errors or broken pages

**Status**: ⬜ Not Tested

---

#### Test 6.2: Navigation Link Behavior
**Objective**: Verify navigation links respect permissions

**Steps**:
1. Login as different user types
2. Click navigation links
3. Verify only accessible links are shown/functional

**Expected Results**:
- Navigation shows/hides links based on permissions
- Clicking restricted links redirects appropriately
- No broken links or errors

**Status**: ⬜ Not Tested

---

#### Test 6.3: Middleware Protection
**Objective**: Verify Next.js middleware protects routes at edge

**Steps**:
1. Test with different user sessions
2. Verify middleware redirects work
3. Check that API routes are also protected

**Expected Results**:
- Middleware redirects unauthenticated users
- Role-based redirects work correctly
- API routes return appropriate status codes

**Status**: ⬜ Not Tested

---

### 7. Permission Matrix Verification

#### Test 7.1: Permission Checks
**Objective**: Verify all permissions work correctly

**Test Matrix**:

| Permission | Admin | Self-Service | Hands-Off | AI-Only |
|------------|-------|--------------|-----------|---------|
| view:dashboard | ✅ | ✅ | ❌ | ❌ |
| view:calendar | ✅ | ✅ | ✅ | ❌ |
| view:messages | ✅ | ✅ | ✅ | ✅ |
| view:health | ✅ | ✅ | ❌ | ❌ |
| view:investments | ✅ | ✅ | ❌ | ❌ |
| view:expenses | ✅ | ✅ | ❌ | ❌ |
| view:insurance | ✅ | ✅ | ❌ | ❌ |
| view:legal | ✅ | ✅ | ❌ | ❌ |
| view:tax | ✅ | ✅ | ❌ | ❌ |
| view:travel | ✅ | ✅ | ❌ | ❌ |
| manage:automation | ✅ | ✅ | ❌ | ❌ |
| manage:users | ✅ | ❌ | ❌ | ❌ |
| view:admin | ✅ | ❌ | ❌ | ❌ |

**Steps**:
1. For each permission, test with each user type
2. Verify access matches the matrix above

**Expected Results**:
- All permissions enforced correctly
- Access matches permission matrix
- No unauthorized access possible

**Status**: ⬜ Not Tested

---

### 8. Edge Cases & Error Handling

#### Test 8.1: Session Expiration
**Objective**: Verify behavior when session expires

**Steps**:
1. Login as any user
2. Wait for session to expire (or manually expire)
3. Try to access protected pages

**Expected Results**:
- User redirected to login
- No errors or broken states
- Session handled gracefully

**Status**: ⬜ Not Tested

---

#### Test 8.2: Invalid Role/Access Mode
**Objective**: Verify handling of invalid role/access mode

**Steps**:
1. Manually modify user role/access mode in database
2. Login and try to access pages

**Expected Results**:
- System handles invalid states gracefully
- Appropriate fallback behavior
- No crashes or errors

**Status**: ⬜ Not Tested

---

#### Test 8.3: Missing Permissions
**Objective**: Verify behavior when permissions are missing

**Steps**:
1. Test with users missing expected permissions
2. Verify fallback behavior

**Expected Results**:
- System defaults to most restrictive access
- No errors or crashes
- User can still access basic functionality

**Status**: ⬜ Not Tested

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Application deployed and accessible
- [ ] Test users created with all roles/access modes
- [ ] Database seeded with test data
- [ ] Browser cache cleared
- [ ] Test environment configured

### Test Execution
- [ ] Authentication & Public Routes (Tests 1.1-1.2)
- [ ] Admin Role Access (Tests 2.1-2.3)
- [ ] Self-Service Client Access (Tests 3.1-3.3)
- [ ] Hands-Off Client Access (Tests 4.1-4.3)
- [ ] AI-Only Client Access (Tests 5.1-5.3)
- [ ] Route Guard Functionality (Tests 6.1-6.3)
- [ ] Permission Matrix Verification (Test 7.1)
- [ ] Edge Cases & Error Handling (Tests 8.1-8.3)

### Post-Test
- [ ] Document any issues found
- [ ] Verify all critical paths work
- [ ] Check browser console for errors
- [ ] Verify API responses are correct
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

## Test Results Template

For each test, document:
- **Test ID**: (e.g., Test 1.1)
- **Test Name**: (e.g., Unauthenticated User Access)
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Partial
- **Notes**: Any observations or issues
- **Screenshots**: If applicable
- **Browser**: Chrome / Firefox / Safari
- **Date**: YYYY-MM-DD

## Known Issues

Document any issues found during testing:
- Issue description
- Steps to reproduce
- Expected vs actual behavior
- Severity (Critical / High / Medium / Low)
- Workaround (if any)

## Sign-Off

- **Tested By**: ________________
- **Date**: ________________
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Partial
- **Notes**: ________________

---

## Quick Test Script

For quick verification, test these critical paths:

1. **Admin Login** → `/admin` → Create user → Edit user → Delete user
2. **Self-Service Login** → `/dashboard` → Navigate to all service pages
3. **Hands-Off Login** → `/dashboard` → Verify minimal dashboard → Try accessing `/health` (should redirect)
4. **AI-Only Login** → `/dashboard` → Verify AI-only dashboard → Try accessing `/calendar` (should redirect)
5. **Logout** → Try accessing `/dashboard` (should redirect to login)
