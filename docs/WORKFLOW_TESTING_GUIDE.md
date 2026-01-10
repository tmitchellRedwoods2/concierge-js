# Workflow Testing Guide

## Current State

### What We Have Now

**Workflows use automation actions internally:**
- The workflow execution route (`/api/workflows/execute`) now uses `automationEngine.executeSingleAction()` for:
  - Calendar event creation (`create_calendar_event` action)
  - Email notifications (`send_email` action)
- This is **under the hood** - workflows still work the same way from the user's perspective

**Current Workflow Execution:**
- Hardcoded workflow steps (trigger → AI → API → end)
- API step uses automation actions internally
- Not yet using the visual workflow designer's node structure

### What We Can Test Now

1. **Existing Workflow Execution**
   - Execute a workflow via `/api/workflows/execute`
   - Should create calendar events using automation actions
   - Should send emails using automation actions
   - Should work the same as before, but with cleaner code

2. **Automation Rules**
   - Create/edit automation rules
   - Execute automation rules
   - Rules use the same action implementations

## What We Could Add

### Option 1: Workflow Step Type for Automation Actions

Add a new workflow step type that allows selecting an automation action:

```typescript
// In workflow designer
{
  type: 'automation_action',
  config: {
    actionType: 'create_calendar_event',
    actionConfig: { title, startDate, ... }
  }
}
```

### Option 2: Workflow Step Type for Automation Rules

Add a new workflow step type that executes an entire automation rule:

```typescript
// In workflow designer
{
  type: 'automation_rule',
  config: {
    ruleId: 'rule-123',
    passContext: true // Pass workflow context to rule
  }
}
```

## Testing the Current Integration

### Test 1: Execute Existing Workflow

1. Go to Workflows page
2. Click "Execute" on a workflow
3. Enter recipient email
4. Verify:
   - Calendar event is created (using automation action)
   - Email is sent (using automation action)
   - Execution log shows success

### Test 2: Create Automation Rule and Use in Workflow

**Current limitation:** Workflows don't yet have a UI step type for automation rules/actions.

**What we can test:**
- Create an automation rule with `create_calendar_event` action
- Execute the rule directly
- Verify it works the same as workflow's internal action

### Test 3: Verify Code Reuse

- Both workflows and automation rules use the same action implementations
- Changes to automation actions affect both systems
- Single source of truth confirmed

## Next Steps for Full Integration

To properly test workflows using automation rules as steps, we need to:

1. **Add "Automation Action" node type to workflow designer**
   - Allow selecting action type (create_calendar_event, send_email, etc.)
   - Configure action parameters
   - Execute action when workflow runs

2. **Add "Automation Rule" node type to workflow designer**
   - Allow selecting an existing automation rule
   - Execute entire rule as workflow step
   - Pass workflow context to rule

3. **Update workflow execution to use designer's node structure**
   - Currently hardcoded, should use workflow.nodes from designer
   - Execute each node based on its type
   - Handle automation_action and automation_rule node types

## Recommendation

**For now, we can test:**
- ✅ Workflows execute and use automation actions internally
- ✅ Automation rules work independently
- ✅ Both use the same action implementations (code reuse confirmed)

**To fully test the integration, we should:**
- Add automation_action/automation_rule node types to workflow designer
- Update workflow execution to use designer's node structure
- Then create a workflow that explicitly uses automation rules as steps

