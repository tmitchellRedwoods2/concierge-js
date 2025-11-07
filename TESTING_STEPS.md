# Testing Workflow with Automation Rules - Step by Step

## Quick Test Checklist

### Step 1: Set Up Automation Rules
- [ ] Go to Workflows page
- [ ] Click "Automation Rules" tab
- [ ] Click "Setup Demo Rules" button
- [ ] Verify rules are created (should see 6 rules)

### Step 2: Configure Test Workflow
- [ ] Find "Test Workflow with Automation Rule" in the list
- [ ] Click "Edit" to open workflow designer
- [ ] Click on the purple "Automation Rule" node
- [ ] Select an automation rule from dropdown (e.g., "Medical Appointment Detection")
- [ ] Click "Save Configuration"
- [ ] Click "Save Workflow"

### Step 3: Execute Workflow
- [ ] Click "Execute" on the test workflow
- [ ] Enter recipient email
- [ ] Enter test content: "I need to schedule an appointment with Dr. Smith on January 15th at 2 PM"
- [ ] Click "Execute Workflow"

### Step 4: Verify Results
- [ ] Check execution results
- [ ] Verify automation rule executed
- [ ] Check if calendar event was created (if rule has create_calendar_event)
- [ ] Check if email was sent (if rule has send_email)

## What to Look For

### Success Indicators:
- ✅ Workflow execution completes
- ✅ Automation rule node shows "completed" status
- ✅ Actions in the rule execute successfully
- ✅ Calendar event created (if applicable)
- ✅ Email sent (if applicable)

### Common Issues:
- ❌ "Automation rule not found" - Make sure demo rules are set up
- ❌ "Rule is disabled" - Enable the rule in Automation Rules tab
- ❌ Actions fail - Check Google Calendar/Gmail credentials

