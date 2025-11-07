# Automation Rules as Reusable Action Library for Workflows

## The Original Design Intent

Looking at the current workflow execution code (`/api/workflows/execute/route.ts`), I can see the problem:

### Current Workflow Implementation (Hardcoded Actions)

```typescript
// Step 3: Create internal calendar event
const inAppCalendarService = new InAppCalendarService();
calendarResult = await inAppCalendarService.createEvent(eventData, session.user.id);

// Send email notification
const notificationService = new NotificationService();
const notificationResult = await notificationService.sendAppointmentConfirmation(...);
```

**Problems:**
1. **Code Duplication**: Workflows have hardcoded logic for calendar events and email notifications
2. **No Reusability**: Each workflow step type needs its own implementation
3. **Maintenance Burden**: Changes to email/calendar logic need to be made in multiple places
4. **Limited Actions**: Workflows can only do what's hardcoded in the execution route

### The Solution: Automation Rules as Action Library

**Automation Rules were designed to be a reusable action library that workflows can use.**

Instead of workflows having hardcoded implementations, they should:
1. **Use Automation Rule Actions**: Workflows execute automation rule actions as steps
2. **Reuse Existing Logic**: All action logic lives in `AutomationEngine`
3. **Easy to Extend**: Add new actions to automation rules, workflows automatically get them
4. **Consistent Behavior**: Same actions work the same way in workflows and rules

## How It Should Work

### Workflow Step Types Should Map to Automation Actions

Instead of:
```typescript
// Hardcoded in workflow execution
const inAppCalendarService = new InAppCalendarService();
await inAppCalendarService.createEvent(...);
```

Workflows should:
```typescript
// Use automation rule action
await automationEngine.executeAction({
  type: 'create_calendar_event',
  config: { title, startDate, endDate, ... }
}, context);
```

### Workflow Node Types → Automation Actions

| Workflow Node Type | Should Use Automation Action |
|-------------------|------------------------------|
| `api` (calendar) | `create_calendar_event` |
| `api` (email) | `send_email` |
| `api` (webhook) | `webhook_call` |
| `condition` | `conditional` |
| (new) `wait` | `wait` |
| (new) `sms` | `send_sms` |

## Benefits

1. **Single Source of Truth**: All action logic in `AutomationEngine`
2. **No Code Duplication**: Workflows reuse automation rule actions
3. **Easy to Extend**: Add new action type → workflows can use it
4. **Consistent Behavior**: Same action works same way everywhere
5. **Better Testing**: Test actions once, use everywhere
6. **Cleaner Workflows**: Workflows become orchestrators, not implementers

## Implementation Approach

### Option 1: Workflow Steps Execute Automation Actions Directly

When a workflow has an `api` step that should create a calendar event:

```typescript
// In workflow execution
case 'api':
  if (step.config.actionType === 'create_calendar_event') {
    // Use automation engine action
    await automationEngine.executeAction({
      type: 'create_calendar_event',
      config: step.config
    }, workflowContext);
  }
  break;
```

### Option 2: New Workflow Node Type "Automation Action"

Add a new node type that directly executes automation actions:

```typescript
// In workflow designer
<Button onClick={() => addNode('automation_action')}>
  Automation Action
</Button>

// In workflow execution
case 'automation_action':
  await automationEngine.executeAction(
    step.config.action,
    workflowContext
  );
  break;
```

### Option 3: Workflow Steps ARE Automation Actions

Make workflow steps use the same structure as automation actions:

```typescript
// Workflow step structure matches automation action
{
  type: 'create_calendar_event',  // Same as automation action
  config: { title, startDate, ... }
}

// Workflow execution just calls automation engine
await automationEngine.executeAction(step, context);
```

## The Key Insight

**Automation Rules were designed as a reusable action library, not just a separate automation system.**

The actions in `AutomationEngine` (send_email, create_calendar_event, webhook_call, etc.) are meant to be:
- Used by automation rules (automatic triggers)
- Used by workflows (orchestrated steps)
- Used by any other system that needs these actions

This is why automation rules have a clean action system - it's meant to be the **action library** for the entire platform.

## Current State vs. Intended State

### Current State (Redundant):
- Workflows: Hardcoded calendar/email logic
- Automation Rules: Action library with same capabilities
- **Result**: Code duplication, maintenance burden

### Intended State (Reusable):
- Automation Rules: Action library (reusable actions)
- Workflows: Use automation rule actions as steps
- **Result**: Single source of truth, easy to extend

## Next Steps

1. **Refactor workflow execution** to use `AutomationEngine.executeAction()` instead of hardcoded logic
2. **Map workflow step types** to automation actions
3. **Add automation action node type** to workflow designer (optional)
4. **Remove duplicate code** from workflow execution
5. **Test**: Ensure workflows work with automation actions

This would make workflows cleaner, eliminate duplication, and make the system easier to extend.

