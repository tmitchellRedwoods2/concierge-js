# Workflow and Automation Rule Integration

## Current Architecture

### Workflows (`/api/workflows/execute`)
**Purpose**: Complex multi-step processes with visual designer

**Current Flow**:
1. **Trigger**: Manual execution or event-based
2. **Steps**:
   - Trigger processing (email, webhook, etc.)
   - AI Processing (extract data, analyze)
   - API Calls (create calendar events, send notifications)
   - End (completion)
3. **Actions**:
   - Creates calendar events via `InAppCalendarService`
   - Sends email notifications via `NotificationService`
   - Syncs to external calendars via `CalendarSyncService`
   - Stores execution history in MongoDB

**Example Workflow Execution**:
```typescript
// POST /api/workflows/execute
{
  workflowId: "workflow-123",
  triggerData: {
    email: "user@example.com",
    content: "I need to schedule an appointment"
  }
}
```

**Current Implementation** (`src/app/api/workflows/execute/route.ts`):
- Processes trigger data
- Runs AI analysis
- Creates calendar events
- Sends notifications
- Stores execution results

### Automation Rules (`/api/automation/rules`)
**Purpose**: Simple rule-based automations triggered by events

**Current Flow**:
1. **Triggers**:
   - Email patterns (via `EmailTriggerService`)
   - Schedule (cron expressions)
   - Calendar events
   - Webhooks
   - Time-based

2. **Actions**:
   - `send_email` - Send email notifications
   - `send_sms` - Send SMS messages
   - `create_calendar_event` - Create calendar events
   - `update_calendar_event` - Update existing events
   - `webhook_call` - Call external webhooks
   - `wait` - Add delays
   - `conditional` - Conditional logic

**Example Automation Rule**:
```typescript
{
  name: "Medical Appointment Detection",
  trigger: {
    type: "email",
    conditions: {
      patterns: ["appointment", "doctor", "medical"]
    }
  },
  actions: [
    {
      type: "create_calendar_event",
      config: { title: "Medical Appointment", ... }
    },
    {
      type: "send_email",
      config: { to: "user@example.com", ... }
    }
  ]
}
```

**Current Implementation** (`src/lib/services/automation-engine.ts`):
- Stores rules in MongoDB
- Executes rules when triggered
- Logs execution history
- Supports conditional actions

## Current Relationship

**Workflows and Automation Rules are currently SEPARATE systems:**

1. **Workflows** don't trigger automation rules
2. **Automation Rules** don't call workflows
3. They both can:
   - Create calendar events
   - Send email notifications
   - But they do it independently

## How They Could Be Integrated

### Option 1: Workflow Step to Execute Automation Rule

Add a new workflow step type that executes an automation rule:

```typescript
// In workflow execution
{
  id: 'automation-1',
  type: 'automation_rule',
  config: {
    ruleId: 'rule-123',
    passData: true // Pass workflow context to rule
  }
}
```

**Implementation**:
```typescript
// In /api/workflows/execute/route.ts
case 'automation_rule':
  const ruleId = step.config.ruleId;
  const ruleContext = {
    userId: session.user.id,
    triggerData: {
      ...workflowContext,
      workflowExecutionId: executionId,
      workflowStep: step.id
    }
  };
  await automationEngine.executeRule(ruleId, ruleContext);
  break;
```

### Option 2: Automation Rule Action to Execute Workflow

Add a new automation action that executes a workflow:

```typescript
{
  type: 'execute_workflow',
  config: {
    workflowId: 'workflow-123',
    triggerData: {
      // Data to pass to workflow
    }
  }
}
```

**Implementation**:
```typescript
// In automation-engine.ts
private async executeWorkflowAction(
  action: AutomationAction, 
  context: AutomationContext
): Promise<{ message: string; details: any }> {
  const { workflowId, triggerData } = action.config;
  
  // Call workflow execution API
  const response = await fetch('/api/workflows/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowId,
      triggerData: {
        ...triggerData,
        automationRuleId: context.executionId,
        automationContext: context
      }
    })
  });
  
  const result = await response.json();
  return {
    message: `Workflow ${workflowId} executed`,
    details: result
  };
}
```

### Option 3: Workflow Completion Triggers Automation Rules

When a workflow completes, automatically check for matching automation rules:

```typescript
// In /api/workflows/execute/route.ts (after workflow completes)
if (executionResult.status === 'completed') {
  // Find automation rules that trigger on workflow completion
  const rules = await automationEngine.getUserRules(session.user.id);
  const workflowRules = rules.filter(rule => 
    rule.trigger.type === 'workflow_completion' &&
    rule.trigger.conditions.workflowId === workflowId
  );
  
  for (const rule of workflowRules) {
    await automationEngine.executeRule(rule.id, {
      userId: session.user.id,
      triggerData: {
        workflowExecution: executionResult,
        workflowId
      }
    });
  }
}
```

## Recommended Integration Approach

**Option 1** (Workflow Step → Automation Rule) is recommended because:

1. **More Flexible**: Workflows can choose which rules to execute
2. **Better Control**: Workflow designer can visually show rule execution
3. **Reusable**: Same automation rules can be used by multiple workflows
4. **Easier to Debug**: Clear workflow step shows when rule is executed

## Implementation Steps

1. **Add automation_rule step type to WorkflowDesigner**
2. **Update workflow execution to handle automation_rule steps**
3. **Add UI in workflow designer to select automation rules**
4. **Pass workflow context to automation rules**
5. **Update automation rule execution to handle workflow context**

## Example Use Case

**Scenario**: When a workflow creates a calendar event, automatically send a follow-up email 24 hours before the event.

**Current**: Would require two separate systems
**With Integration**: Workflow can execute an automation rule as a step

```typescript
// Workflow steps:
1. Trigger: Email received
2. AI: Extract appointment details
3. API: Create calendar event
4. Automation Rule: "Send appointment reminder" (executes rule)
5. End: Complete
```

The automation rule would:
- Wait 24 hours before event
- Send email reminder
- All managed within the workflow execution

