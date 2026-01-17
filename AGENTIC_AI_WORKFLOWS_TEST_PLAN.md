# Agentic AI Workflows - System Test Plan

## Overview
This test plan covers end-to-end system testing of the Agentic AI Workflows feature, including all user roles, API endpoints, UI components, and integrations.

**Test Environment:** Vercel Preview Deployment (develop branch)  
**Date:** Generated automatically  
**Feature Version:** Phase 1-5 Complete

---

## Test Users & Credentials

| Role | Username | Password | Access Mode | Purpose |
|------|----------|----------|-------------|---------|
| Admin | `admin_test` | `AdminTest123!` | N/A | Create/manage workflows, view analytics |
| Agent | `agent_test` | `AgentTest123!` | N/A | Create/manage workflows for clients |
| Hands-Off Client | `handsoff_test` | `HandsOff123!` | `hands-off` | View agentic workflows (primary test user) |
| Self-Service Client | `selfservice_test` | `SelfService123!` | `self-service` | Verify no access to agentic workflows |
| AI-Only Client | `aionly_test` | `AIOnly123!` | `ai-only` | Verify no access to agentic workflows |

---

## Test Categories

### 1. Authentication & Authorization Tests

#### TC-1.1: Hands-Off User Can Access Agentic Workflows Page
**Test Steps:**
1. Log in as `handsoff_test` / `HandsOff123!`
2. Navigate to `/agentic-workflows`
3. Verify page loads without errors
4. Verify user can see workflow list

**Expected Results:**
- ✅ Page loads successfully
- ✅ View-only interface displays
- ✅ No edit/delete buttons visible
- ✅ Workflows list is visible (may be empty if none assigned)

---

#### TC-1.2: Self-Service User Cannot Access Agentic Workflows
**Test Steps:**
1. Log in as `selfservice_test` / `SelfService123!`
2. Navigate to `/agentic-workflows`
3. Verify access is denied

**Expected Results:**
- ✅ Redirected or 403 error
- ✅ No access to agentic workflows page

---

#### TC-1.3: Admin Can Access All Agentic Workflow Features
**Test Steps:**
1. Log in as `admin_test` / `AdminTest123!`
2. Navigate to `/agentic-workflows`
3. Navigate to `/workflows`
4. Verify both pages load

**Expected Results:**
- ✅ Can access agentic workflows page
- ✅ Can access workflows creation page
- ✅ Can create agentic workflows

---

#### TC-1.4: Agent Can Access Workflow Management
**Test Steps:**
1. Log in as `agent_test` / `AgentTest123!`
2. Navigate to `/workflows`
3. Verify workflow creation is available

**Expected Results:**
- ✅ Can access workflows page
- ✅ Can create agentic workflows

---

### 2. Workflow Auto-Assignment Tests

#### TC-2.1: New Hands-Off User Gets Agentic Workflows Assigned
**Test Steps:**
1. Log in as `admin_test`
2. Create a new hands-off user via `/admin/users/new`:
   - Username: `test_handsoff_new`
   - Email: `test_handsoff_new@test.com`
   - Password: `Test123!`
   - Role: `client`
   - Access Mode: `hands-off`
3. Log out and log in as the new user
4. Navigate to `/agentic-workflows`

**Expected Results:**
- ✅ New user is created successfully
- ✅ Agentic workflows are automatically assigned (6 templates)
- ✅ Workflows appear in `/agentic-workflows` page
- ✅ All workflows are active by default

**Verification:**
```bash
# Check API to verify workflows were assigned
curl https://your-preview-url.vercel.app/api/agentic-workflows \
  -H "Cookie: [session cookie]"
```

---

#### TC-2.2: Existing Hands-Off User Does Not Get Duplicate Workflows
**Test Steps:**
1. Log in as `handsoff_test`
2. Note current workflow count
3. Create workflows manually (as admin) for this user
4. Verify no duplicates are created

**Expected Results:**
- ✅ No duplicate workflows created
- ✅ Workflow count remains consistent

---

#### TC-2.3: Non-Hands-Off Users Do Not Get Auto-Assigned Workflows
**Test Steps:**
1. Create new self-service user
2. Check `/workflows` page
3. Verify no agentic workflows assigned automatically

**Expected Results:**
- ✅ Self-service users don't get agentic workflows
- ✅ AI-only users don't get agentic workflows

---

### 3. API Endpoint Tests

#### TC-3.1: GET /api/agentic-workflows - List Workflows
**Test Steps:**
1. Log in as `handsoff_test`
2. Call API: `GET /api/agentic-workflows`
3. Verify response structure

**Expected Results:**
```json
{
  "success": true,
  "workflows": [
    {
      "id": "string",
      "name": "string",
      "isAgentic": true,
      "targetAccessMode": ["hands-off"],
      "executionPriority": 8,
      ...
    }
  ],
  "count": 6
}
```

**Test Cases:**
- ✅ Returns only agentic workflows
- ✅ Filters by targetAccessMode correctly
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if no permission

---

#### TC-3.2: GET /api/agentic-workflows/[id] - Get Workflow Details
**Test Steps:**
1. Get workflow ID from list endpoint
2. Call: `GET /api/agentic-workflows/[workflowId]`
3. Verify response includes executions and stats

**Expected Results:**
```json
{
  "success": true,
  "workflow": { ... },
  "executions": [ ... ],
  "stats": {
    "total": 0,
    "completed": 0,
    "failed": 0
  }
}
```

**Test Cases:**
- ✅ Returns workflow details
- ✅ Returns execution history (up to 20)
- ✅ Returns execution statistics
- ✅ 404 if workflow not found
- ✅ 403 if workflow not accessible

---

#### TC-3.3: GET /api/agentic-workflows/executions - Get Execution Logs
**Test Steps:**
1. Call: `GET /api/agentic-workflows/executions`
2. Test query parameters:
   - `?workflowId=xxx`
   - `?status=completed`
   - `?limit=10&offset=0`
   - `?startDate=2024-01-01&endDate=2024-12-31`

**Expected Results:**
```json
{
  "success": true,
  "executions": [ ... ],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0
  },
  "stats": { ... }
}
```

**Test Cases:**
- ✅ Returns paginated executions
- ✅ Filters by workflowId correctly
- ✅ Filters by status correctly
- ✅ Filters by date range correctly
- ✅ Calculates stats correctly

---

#### TC-3.4: GET /api/agentic-workflows/templates - List Templates
**Test Steps:**
1. Log in as `admin_test`
2. Call: `GET /api/agentic-workflows/templates`
3. Test query parameters:
   - `?category=health`
   - `?accessMode=hands-off`

**Expected Results:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "email-appointment-scheduling",
      "name": "Email Appointment Scheduling",
      "category": "health",
      ...
    }
  ],
  "count": 6
}
```

**Test Cases:**
- ✅ Returns all 6 templates
- ✅ Filters by category correctly
- ✅ Filters by accessMode correctly
- ✅ Returns 401 if not authenticated

---

#### TC-3.5: GET /api/agentic-workflows/templates/[id] - Get Template
**Test Steps:**
1. Call: `GET /api/agentic-workflows/templates/email-appointment-scheduling`
2. Verify template details

**Expected Results:**
- ✅ Returns complete template definition
- ✅ Includes all workflow configuration
- ✅ 404 if template not found

---

#### TC-3.6: POST /api/agentic-workflows/templates/[id] - Instantiate Template
**Test Steps:**
1. Log in as `admin_test`
2. Call: `POST /api/agentic-workflows/templates/email-appointment-scheduling`
3. Optionally pass customization:
```json
{
  "name": "Custom Name",
  "targetAccessMode": ["hands-off"],
  "executionPriority": 9,
  "isActive": false
}
```

**Expected Results:**
- ✅ Creates workflow from template
- ✅ Workflow has unique ID
- ✅ Can customize name, priority, etc.
- ✅ Returns 403 for non-admin/agent users

---

#### TC-3.7: GET /api/agentic-workflows/analytics - Get Analytics
**Test Steps:**
1. Log in as `admin_test`
2. Call: `GET /api/agentic-workflows/analytics`
3. Test query parameters:
   - `?workflowId=xxx`
   - `?days=30`

**Expected Results:**
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "totalExecutions": 0,
      "successRate": 0,
      "avgDurationMs": 0
    },
    "workflowStats": [ ... ]
  }
}
```

**Test Cases:**
- ✅ Returns analytics data
- ✅ Calculates success rates correctly
- ✅ Filters by workflowId
- ✅ Filters by date range (days parameter)
- ✅ Returns 403 for non-admin/agent users

---

### 4. UI Component Tests

#### TC-4.1: Hands-Off Workflows Page - Display
**Test Steps:**
1. Log in as `handsoff_test`
2. Navigate to `/agentic-workflows`
3. Verify all UI components render

**Expected Results:**
- ✅ Page header with title and description
- ✅ Info banner explaining hands-off mode
- ✅ Execution statistics cards (Total, Completed, Failed, Running)
- ✅ Active workflows section
- ✅ Execution history section
- ✅ No edit/delete buttons visible

---

#### TC-4.2: Hands-Off Workflows Page - Workflow Cards
**Test Steps:**
1. Verify workflow cards display correctly
2. Check status badges
3. Verify workflow details

**Expected Results:**
- ✅ Each workflow shows name and description
- ✅ Agentic badge displayed
- ✅ Status badge (Active/Inactive)
- ✅ Trigger type icon
- ✅ Execution priority displayed
- ✅ Target access mode displayed
- ✅ Cards are clickable to expand details

---

#### TC-4.3: Hands-Off Workflows Page - Execution History
**Test Steps:**
1. Verify execution history section
2. Check execution card details

**Expected Results:**
- ✅ Execution cards show workflow name
- ✅ Status badges (Completed, Failed, Running, Timeout)
- ✅ Start/end times formatted correctly
- ✅ Duration calculated and displayed
- ✅ Error messages shown for failed executions
- ✅ Execution steps displayed
- ✅ Calendar event links work (if present)

---

#### TC-4.4: Workflow Creation - Agentic Options
**Test Steps:**
1. Log in as `admin_test`
2. Go to `/workflows`
3. Click "Create New Workflow"
4. Verify agentic workflow fields

**Expected Results:**
- ✅ "Agentic Workflow" checkbox visible
- ✅ When checked, agentic configuration section appears
- ✅ Target Access Mode multi-select (hands-off, self-service, ai-only)
- ✅ Auto-Approve checkbox
- ✅ Execution Priority input (1-10)
- ✅ Max Retries input
- ✅ Retry Delay input
- ✅ All fields save correctly

---

#### TC-4.5: Workflow List - Agentic Badges
**Test Steps:**
1. Create an agentic workflow
2. View workflows list
3. Verify agentic workflows are marked

**Expected Results:**
- ✅ Agentic workflows show purple "Agentic" badge
- ✅ Badge includes Bot icon
- ✅ Non-agentic workflows don't show badge
- ✅ Target access mode displayed
- ✅ Execution priority displayed

---

### 5. Workflow Creation & Management Tests

#### TC-5.1: Create Agentic Workflow via UI
**Test Steps:**
1. Log in as `admin_test`
2. Go to `/workflows`
3. Click "Create New Workflow"
4. Fill in form:
   - Name: "Test Agentic Workflow"
   - Description: "Test description"
   - Trigger: Email
   - Check "Agentic Workflow"
   - Select "hands-off" in Target Access Mode
   - Set Priority: 8
   - Set Max Retries: 3
5. Click "Create Workflow"

**Expected Results:**
- ✅ Workflow created successfully
- ✅ Shows agentic badge in list
- ✅ Appears in `/agentic-workflows` for hands-off users
- ✅ Configuration saved correctly

---

#### TC-5.2: Create Agentic Workflow via API
**Test Steps:**
1. Log in as `admin_test`
2. POST to `/api/workflows`:
```json
{
  "name": "API Agentic Workflow",
  "description": "Created via API",
  "trigger": { "type": "email" },
  "isAgentic": true,
  "targetAccessMode": ["hands-off"],
  "executionPriority": 7,
  "maxRetries": 3,
  "retryDelayMs": 5000
}
```

**Expected Results:**
- ✅ Workflow created successfully
- ✅ Returns workflow with all agentic fields
- ✅ Appears in workflows list
- ✅ Accessible to hands-off users

---

#### TC-5.3: Update Agentic Workflow
**Test Steps:**
1. Get existing agentic workflow ID
2. Update via PUT `/api/workflows`:
```json
{
  "id": "workflow-id",
  "executionPriority": 9,
  "isActive": true
}
```

**Expected Results:**
- ✅ Workflow updated successfully
- ✅ Priority changed
- ✅ Status changed
- ✅ Changes reflected in UI

---

### 6. Workflow Templates Tests

#### TC-6.1: List All Templates
**Test Steps:**
1. Call `GET /api/agentic-workflows/templates`
2. Verify all 6 templates returned

**Expected Results:**
- ✅ Returns 6 templates:
  1. Email Appointment Scheduling
  2. Prescription Refill Automation
  3. Calendar Event Management
  4. Expense Categorization
  5. Insurance Claim Filing
  6. Travel Booking Confirmation
- ✅ Each template has complete configuration

---

#### TC-6.2: Filter Templates by Category
**Test Steps:**
1. Test each category:
   - `?category=health`
   - `?category=finance`
   - `?category=travel`
   - `?category=calendar`
   - `?category=expenses`

**Expected Results:**
- ✅ Health: 2 templates (appointment scheduling, prescription refills)
- ✅ Finance: 1 template (insurance claims)
- ✅ Travel: 1 template (travel booking)
- ✅ Calendar: 1 template (calendar management)
- ✅ Expenses: 1 template (expense categorization)

---

#### TC-6.3: Filter Templates by Access Mode
**Test Steps:**
1. Test: `?accessMode=hands-off`
2. Verify only templates targeting hands-off are returned

**Expected Results:**
- ✅ Returns templates with `targetAccessMode` including "hands-off"
- ✅ Filters correctly for clients

---

#### TC-6.4: Instantiate Template
**Test Steps:**
1. Log in as `admin_test`
2. POST to `/api/agentic-workflows/templates/email-appointment-scheduling`
3. Verify workflow created

**Expected Results:**
- ✅ Workflow created with template configuration
- ✅ Can customize name and settings
- ✅ Workflow ID is unique
- ✅ Appears in workflows list

---

### 7. Execution & Monitoring Tests

#### TC-7.1: View Execution History
**Test Steps:**
1. Log in as `handsoff_test`
2. Navigate to `/agentic-workflows`
3. View execution history section

**Expected Results:**
- ✅ Executions displayed in reverse chronological order
- ✅ Status badges color-coded
- ✅ Duration calculated correctly
- ✅ Error messages visible for failures
- ✅ Empty state message if no executions

---

#### TC-7.2: Execution Statistics Display
**Test Steps:**
1. Verify statistics cards at top of page
2. Check calculations

**Expected Results:**
- ✅ Total Executions card
- ✅ Completed card (green)
- ✅ Failed card (red)
- ✅ Running card (blue)
- ✅ Numbers match execution history

---

#### TC-7.3: Analytics API Calculations
**Test Steps:**
1. Create test executions (manually or via workflow triggers)
2. Call analytics API
3. Verify calculations

**Expected Results:**
- ✅ Success rate calculated: `(completed / total) * 100`
- ✅ Average duration calculated correctly
- ✅ Error rate calculated: `((failed + timeout) / total) * 100`
- ✅ Per-workflow statistics accurate

---

### 8. Integration Tests

#### TC-8.1: Auto-Assignment on User Creation
**Test Steps:**
1. Log in as `admin_test`
2. Create new hands-off user via API:
```json
POST /api/admin/users
{
  "username": "test_auto_assign",
  "email": "auto@test.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User",
  "role": "client",
  "accessMode": "hands-off"
}
```
3. Immediately log in as new user
4. Check `/api/agentic-workflows`

**Expected Results:**
- ✅ User created successfully
- ✅ 6 agentic workflows automatically assigned
- ✅ All workflows active by default
- ✅ Workflows visible in `/agentic-workflows` page

---

#### TC-8.2: Workflow Visibility Across Access Modes
**Test Steps:**
1. Create agentic workflow with `targetAccessMode: ["hands-off"]`
2. Log in as hands-off user - verify visible
3. Log in as self-service user - verify NOT visible
4. Log in as admin - verify visible (admins see all)

**Expected Results:**
- ✅ Hands-off users see workflows targeting them
- ✅ Self-service users don't see hands-off workflows
- ✅ Admins see all workflows
- ✅ Agents see relevant workflows

---

#### TC-8.3: Permission Enforcement
**Test Steps:**
1. Attempt to access `/agentic-workflows` as self-service user
2. Attempt to create workflow as hands-off user
3. Attempt to view analytics as hands-off user

**Expected Results:**
- ✅ Self-service users: 403 or redirect
- ✅ Hands-off users: Cannot create workflows (UI not available)
- ✅ Hands-off users: Cannot access analytics API (403)

---

### 9. Edge Cases & Error Handling

#### TC-9.1: Empty States
**Test Steps:**
1. Create hands-off user with no workflows assigned
2. Navigate to `/agentic-workflows`
3. Verify empty state messages

**Expected Results:**
- ✅ Friendly empty state message
- ✅ Explains that admin can configure workflows
- ✅ No errors or broken UI

---

#### TC-9.2: Invalid Workflow ID
**Test Steps:**
1. Call `GET /api/agentic-workflows/invalid-id`
2. Verify error handling

**Expected Results:**
- ✅ Returns 404 Not Found
- ✅ Clear error message
- ✅ No stack traces exposed

---

#### TC-9.3: Invalid Template ID
**Test Steps:**
1. Call `GET /api/agentic-workflows/templates/invalid-template`
2. Verify error handling

**Expected Results:**
- ✅ Returns 404 Not Found
- ✅ Clear error message

---

#### TC-9.4: Missing Authentication
**Test Steps:**
1. Call API endpoints without authentication
2. Verify 401 responses

**Expected Results:**
- ✅ All endpoints return 401 Unauthorized
- ✅ Clear error messages
- ✅ No sensitive information leaked

---

#### TC-9.5: Database Connection Issues
**Test Steps:**
1. Simulate database disconnection
2. Verify graceful error handling

**Expected Results:**
- ✅ Returns 500 error
- ✅ Logs error server-side
- ✅ User-friendly error message
- ✅ No stack traces exposed

---

### 10. Performance Tests

#### TC-10.1: Large Execution History
**Test Steps:**
1. Create many executions (if possible)
2. Test pagination
3. Verify page load time

**Expected Results:**
- ✅ Pagination works correctly
- ✅ Page loads in < 2 seconds
- ✅ No memory leaks

---

#### TC-10.2: Multiple Workflows
**Test Steps:**
1. Create 20+ agentic workflows
2. Load `/agentic-workflows` page
3. Verify performance

**Expected Results:**
- ✅ Page loads efficiently
- ✅ All workflows display
- ✅ No performance degradation

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Preview deployment is live
- [ ] Test users created via `/api/admin/setup-test-users`
- [ ] Database is accessible
- [ ] All environment variables configured

### Test Execution
- [ ] Authentication & Authorization Tests (TC-1.x)
- [ ] Workflow Auto-Assignment Tests (TC-2.x)
- [ ] API Endpoint Tests (TC-3.x)
- [ ] UI Component Tests (TC-4.x)
- [ ] Workflow Creation Tests (TC-5.x)
- [ ] Template Tests (TC-6.x)
- [ ] Execution & Monitoring Tests (TC-7.x)
- [ ] Integration Tests (TC-8.x)
- [ ] Edge Cases (TC-9.x)
- [ ] Performance Tests (TC-10.x)

### Post-Testing
- [ ] Document any bugs/issues found
- [ ] Verify all critical paths work
- [ ] Check error logs for warnings
- [ ] Validate analytics calculations

---

## Bug Reporting Template

**Bug ID:** BUG-XXX  
**Test Case:** TC-X.X  
**Severity:** Critical / High / Medium / Low  
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**  
**Actual Result:**  
**Screenshots/Logs:**  
**Environment:** Preview URL, Browser, Date/Time

---

## Success Criteria

### Must Pass (Critical)
- ✅ Hands-off users can view agentic workflows
- ✅ Auto-assignment works for new hands-off users
- ✅ All API endpoints return correct responses
- ✅ Permission checks work correctly
- ✅ No security vulnerabilities exposed

### Should Pass (Important)
- ✅ UI components render correctly
- ✅ Analytics calculations are accurate
- ✅ Templates can be instantiated
- ✅ Workflows can be created and updated

### Nice to Have (Enhancement)
- ✅ Performance is optimal
- ✅ Empty states are user-friendly
- ✅ Error messages are clear

---

## Notes

- All API tests should include proper authentication headers
- Test data should be cleaned up after testing (or use test database)
- Document any deviations from expected behavior
- Performance baselines: Page load < 2s, API response < 500ms
