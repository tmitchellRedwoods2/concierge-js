# Test Workflow with Automation Rule

## Overview

This document describes how to test a workflow that uses an automation rule step for Google Calendar and Gmail integration.

## Test Workflow Created

A test workflow has been added to the system:

- **ID**: `test-automation-rule-workflow`
- **Name**: "Test Workflow with Automation Rule"
- **Description**: Test workflow that uses an automation rule for Google Calendar/Gmail integration

## Workflow Structure

The test workflow includes:

1. **Trigger Node** - Email trigger that looks for "appointment" in content
2. **AI Node** - Extracts appointment details from email
3. **Automation Rule Node** - Executes an automation rule (e.g., "Medical Appointment Detection")
4. **End Node** - Marks workflow completion

## How to Test

### Step 1: Set Up Automation Rules

1. Go to the Workflows page
2. Click on the "Automation Rules" tab
3. Click "Setup Demo Rules" to create demo automation rules
4. Note the rule IDs (you'll need one for the workflow)

### Step 2: Configure the Test Workflow

1. Go to the Workflows page
2. Find "Test Workflow with Automation Rule" in the list
3. Click "Edit" to open the workflow designer
4. Click on the "Automation Rule" node (purple node)
5. In the configuration modal:
   - Select an automation rule from the dropdown (e.g., "Medical Appointment Detection")
   - The rule ID will be automatically set
6. Click "Save Configuration"
7. Click "Save Workflow" to save the workflow

### Step 3: Execute the Workflow

1. In the Workflows page, find "Test Workflow with Automation Rule"
2. Click "Execute"
3. Enter test data:
   - Email: `test@example.com`
   - Content: `I need to schedule an appointment with Dr. Smith`
4. Click "Execute Workflow"

### Step 4: Verify Results

The workflow should:

1. **Trigger**: Process the email trigger
2. **AI**: Extract appointment details
3. **Automation Rule**: Execute the selected automation rule, which should:
   - Create a calendar event in Google Calendar (if the rule has `create_calendar_event` action)
   - Send an email via Gmail (if the rule has `send_email` action)
4. **End**: Complete successfully

## Expected Behavior

When the automation rule node executes:

- The automation rule will receive the workflow context (trigger data, AI results, etc.)
- All actions in the automation rule will execute
- The rule will have access to:
  - Workflow execution ID
  - Trigger data (email, content)
  - AI results (extracted appointment details)
  - Any calendar event IDs created earlier in the workflow

## Example Automation Rule Actions

The "Medical Appointment Detection" rule typically includes:

1. **create_calendar_event** - Creates a calendar event in Google Calendar
2. **send_email** - Sends a confirmation email via Gmail

## Troubleshooting

### Rule Not Found

If you see "Automation rule not found":
- Make sure you've created demo rules using "Setup Demo Rules"
- Verify the rule ID in the workflow node matches an existing rule
- Check that the rule is enabled

### Rule Not Executing

If the rule doesn't execute:
- Check the browser console for errors
- Verify the rule is enabled
- Check that the rule has actions configured

### Actions Not Working

If actions don't execute:
- Verify Google Calendar integration is set up
- Verify Gmail/SMTP credentials are configured
- Check the execution logs in the workflow results

## Next Steps

Once this test workflow works, you can:

1. Create custom workflows with automation rule steps
2. Chain multiple automation rules in a workflow
3. Use automation rules to integrate with Google Calendar and Gmail
4. Build complex workflows that combine AI processing with real integrations

## Notes

- Automation rules execute with the full workflow context
- Rules can access all data from previous workflow steps
- Multiple automation rules can be used in a single workflow
- Rules are executed sequentially in the order they appear in the workflow

