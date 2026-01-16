# Agentic AI Workflows for Hands-Off Users

## Overview
This feature adds autonomous AI workflows that run automatically for users in the "hands-off" access mode. These workflows act as intelligent agents that handle routine tasks without requiring user intervention, perfect for clients who prefer minimal interaction with the platform.

## Goals
- Enable hands-off users to benefit from automated workflows without manual configuration
- Provide a view-only interface for hands-off users to see what workflows are active for them
- Automatically execute agentic workflows based on triggers (emails, calendar events, schedules, etc.)
- Allow admins/agents to configure and manage agentic workflows on behalf of hands-off users

## Current State
- Hands-off users have limited permissions: `view:messages`, `use:ai-chat`, `view:reports`
- Workflows currently require `manage:automation` permission (not available to hands-off users)
- Workflows exist but are designed for self-service users who can configure them
- No automatic execution system for hands-off users

## Proposed Changes

### 1. Extend Workflow Model
**File**: `src/lib/models/Workflow.ts`

Add new fields:
- `isAgentic: boolean` - Marks workflow as agentic (runs automatically without user approval)
- `targetAccessMode: AccessMode[]` - Which access modes this workflow targets (e.g., ['hands-off'])
- `autoApprove: boolean` - Whether actions should be auto-approved (default: true for agentic)
- `executionPriority: number` - Priority for execution (higher = more important)
- `maxRetries: number` - Maximum retry attempts on failure
- `retryDelayMs: number` - Delay between retries

### 2. Add Permissions
**File**: `src/lib/auth/permissions.ts`

Add new permission:
- `view:agentic-workflows` - View-only access to agentic workflows

Update hands-off permissions:
```typescript
'hands-off': [
  'view:messages',
  'use:ai-chat',
  'view:reports',
  'view:agentic-workflows', // NEW
],
```

### 3. Create Agentic Workflow Service
**File**: `src/lib/services/agentic-workflow-executor.ts`

Service responsibilities:
- Monitor triggers for agentic workflows
- Execute workflows automatically when triggers fire
- Handle retries and error recovery
- Log all executions for transparency
- Send notifications to users about workflow actions (optional)

### 4. Create Hands-Off Workflows Page
**File**: `src/app/agentic-workflows/page.tsx`

Features:
- View-only interface showing active agentic workflows
- Execution history and logs
- Status indicators (active, paused, error)
- Recent activity feed
- No edit/configuration options (hands-off users can't modify)

### 5. Create API Endpoints
**Files**: 
- `src/app/api/agentic-workflows/route.ts` - List agentic workflows for current user
- `src/app/api/agentic-workflows/[id]/route.ts` - Get workflow details and execution history
- `src/app/api/agentic-workflows/executions/route.ts` - Get execution logs

### 6. Background Worker
**File**: `src/lib/workers/agentic-workflow-worker.ts`

Responsibilities:
- Poll for trigger events (emails, calendar events, schedules)
- Match triggers to active agentic workflows
- Queue workflow executions
- Process execution queue
- Handle failures and retries

### 7. Admin/Agent Workflow Management
**Enhancement**: Update existing workflows page to support:
- Creating workflows with `isAgentic: true` and `targetAccessMode: ['hands-off']`
- Assigning workflows to specific users or all hands-off users
- Viewing execution logs for all agentic workflows

### 8. Default Agentic Workflows
Create pre-configured agentic workflows for common hands-off use cases:
- **Email Appointment Scheduling**: Automatically schedule appointments from emails
- **Prescription Refill Automation**: Auto-refill prescriptions when eligible
- **Calendar Event Management**: Automatically accept/decline calendar invites based on rules
- **Expense Categorization**: Automatically categorize expenses from receipts
- **Insurance Claim Filing**: Automatically file insurance claims from medical bills
- **Travel Booking Confirmation**: Automatically confirm travel bookings from emails

## Implementation Phases

### Phase 1: Foundation (Completed)
- [x] Create plan document
- [x] Extend Workflow model with agentic fields
- [x] Add `view:agentic-workflows` permission
- [x] Update permissions for hands-off users

### Phase 2: Core Services (Completed)
- [x] Create agentic workflow executor service
- [x] Create background worker for trigger monitoring
- [x] Create execution queue system
- [x] Add execution logging

### Phase 3: API & UI (Completed)
- [x] Create API endpoints for agentic workflows
  - [x] GET /api/agentic-workflows - List workflows for user
  - [x] GET /api/agentic-workflows/[id] - Get workflow details and execution history
  - [x] GET /api/agentic-workflows/executions - Get execution logs with filtering
- [x] Create hands-off workflows page (view-only)
- [x] Add execution history UI
- [x] Add status indicators and activity feed
- [x] Unit tests for all API endpoints
- [x] Integration tests for workflow execution flow

### Phase 4: Admin Tools (Completed)
- [x] Enhance workflows page for agentic workflow creation
  - [x] Added isAgentic checkbox to workflow creation form
  - [x] Added targetAccessMode multi-select for hands-off/self-service/ai-only
  - [x] Added agentic configuration fields (autoApprove, executionPriority, maxRetries, retryDelayMs)
  - [x] Updated workflows API to support agentic workflow fields
  - [x] Added agentic badges to workflow cards
- [ ] Add workflow assignment UI (Future enhancement - workflows are automatically available based on targetAccessMode)
- [x] Add execution monitoring API
  - [x] GET /api/agentic-workflows/analytics - Returns analytics and monitoring data
- [x] Add workflow analytics
  - [x] Success rate calculations
  - [x] Execution times (average duration)
  - [x] Error rates by workflow
  - [x] Per-workflow statistics

### Phase 5: Default Workflows (Completed)
- [x] Create default agentic workflow templates
  - [x] Email Appointment Scheduling
  - [x] Prescription Refill Automation
  - [x] Calendar Event Management
  - [x] Expense Categorization
  - [x] Insurance Claim Filing
  - [x] Travel Booking Confirmation
- [x] Add workflow templates API
  - [x] GET /api/agentic-workflows/templates - List all templates
  - [x] GET /api/agentic-workflows/templates/[templateId] - Get template details
  - [x] POST /api/agentic-workflows/templates/[templateId] - Instantiate template
- [x] Auto-assign workflows to new hands-off users
  - [x] Created agentic-workflow-assignment service
  - [x] Integrated into admin user creation endpoint
  - [x] Automatic assignment when hands-off user is created
- [x] Create workflow templates service
  - [x] Template definitions with categories
  - [x] Template lookup functions
  - [x] Access mode filtering

## Technical Considerations

### Security
- Hands-off users can only VIEW workflows, not modify
- All workflow executions must be logged
- Sensitive actions may require admin review (configurable per workflow)
- Audit trail for all agentic actions

### Performance
- Background worker should be scalable (consider job queue like Bull/BullMQ)
- Trigger polling should be efficient (use webhooks where possible)
- Execution logs should be paginated
- Consider rate limiting for workflow executions

### Reliability
- Workflow executions should be idempotent
- Retry logic with exponential backoff
- Dead letter queue for failed executions
- Health monitoring for background worker

### User Experience
- Hands-off users should see clear status of what's happening
- Notifications for important workflow actions (configurable)
- Simple, clean UI focused on transparency
- No complex configuration options

## Database Schema Changes

```typescript
// Workflow model additions
{
  isAgentic: { type: Boolean, default: false },
  targetAccessMode: { type: [String], enum: ['hands-off', 'self-service', 'ai-only'], default: [] },
  autoApprove: { type: Boolean, default: true },
  executionPriority: { type: Number, default: 5, min: 1, max: 10 },
  maxRetries: { type: Number, default: 3 },
  retryDelayMs: { type: Number, default: 5000 },
}

// New WorkflowExecution model
{
  workflowId: String,
  userId: String,
  status: String, // 'pending', 'running', 'completed', 'failed', 'retrying'
  triggerData: Mixed,
  executionResult: Mixed,
  errorMessage: String,
  retryCount: Number,
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
}
```

## Success Metrics
- Number of hands-off users with active agentic workflows
- Workflow execution success rate
- Average time to complete workflows
- User satisfaction with hands-off experience
- Reduction in manual tasks for hands-off users

## Future Enhancements
- AI-powered workflow suggestions based on user behavior
- Workflow templates marketplace
- Multi-user workflow sharing
- Workflow versioning and rollback
- Advanced trigger conditions (ML-based)
- Workflow performance analytics
- Cost tracking per workflow execution

