# Testing New Automation Features

## Overview
This document outlines how to test the newly deployed automation features:
1. Execution logging and visibility
2. Expandable rule details view
3. Authentication fixes

## Prerequisites
- ✅ Vercel deployment is complete (check Vercel dashboard)
- ✅ You're logged into the application
- ✅ You have demo automation rules set up (or can create them)

---

## Test 1: Expandable Rule Details View

### Steps:
1. Navigate to **Workflows** → **Automation Rules** tab
2. Locate any automation rule card
3. Look for the **"▶ Show Details"** button at the bottom of the rule card
4. Click **"▶ Show Details"**

### Expected Results:
- ✅ Section expands to show:
  - **Trigger Configuration**: JSON showing trigger type and conditions
  - **Actions**: List of all actions with details:
    - **Conditional actions**: Shows condition logic (e.g., "Check if 'subject' contains 'appointment'")
    - **Email actions**: Shows recipient, subject, template
    - **Calendar event actions**: Shows title, location
  - **Full Configuration**: Expandable JSON for each action
5. Click **"▼ Hide Details"** to collapse

### Success Criteria:
- [ ] Details section expands/collapses smoothly
- [ ] Trigger configuration is displayed correctly
- [ ] All actions are listed with appropriate details
- [ ] Conditional logic is clearly explained
- [ ] JSON configurations are readable

---

## Test 2: Execution Logging and Visibility

### Part A: Execute a Rule and View Results

#### Steps:
1. In **Automation Rules** tab, find a rule (preferably one without conditionals, like "Daily Health Check Reminder")
2. Click the **Play button** (▶) to execute the rule
3. Wait for the alert dialog to appear

#### Expected Results:
- ✅ Alert dialog shows:
  - "Rule executed successfully!"
  - **Status**: success/failed/partial
  - **Actions**: List showing each action with status:
    - ✅ for successful actions
    - ❌ for failed actions
    - Action type and message (e.g., "send_email: ✅ Email sent successfully to user@example.com")

### Part B: View Recent Executions Section

#### Steps:
1. After executing a rule, scroll down in the **Automation Rules** tab
2. Look for the **"Recent Executions"** card section

#### Expected Results:
- ✅ Card appears with title "Recent Executions"
- ✅ Shows up to 10 most recent rule executions
- ✅ Each execution entry displays:
  - Rule name
  - Status badge (success/partial/failed)
  - Timestamp
  - Duration (if available)
  - **Actions section** showing:
    - ✅/❌ indicator for each action
    - Action type (e.g., "send email", "create calendar event")
    - Action message/status
    - Details like recipient email, event title, etc.

### Success Criteria:
- [ ] Alert dialog shows detailed execution results
- [ ] Recent Executions section appears after executing rules
- [ ] Action details are visible (emails sent, events created, etc.)
- [ ] Status indicators (✅/❌) are correct
- [ ] Timestamps are accurate

---

## Test 3: Authentication Fix

### Steps:
1. Navigate to **Workflows** → **Automation Rules** tab
2. Click **"Setup Demo Rules"** button (if no rules exist)
3. Wait for completion

#### Expected Results:
- ✅ No error: "(0, v.getServerSession) is not a function"
- ✅ Success message: "Demo automation rules created successfully!"
- ✅ Rules appear in the list

### Success Criteria:
- [ ] Demo rules can be created without authentication errors
- [ ] Rules are visible in the list
- [ ] Rules can be toggled on/off
- [ ] Rules can be executed

---

## Test 4: Conditional Action Behavior

### Steps:
1. Find a rule with a conditional action (e.g., "Medical Appointment Detection")
2. Click **"▶ Show Details"** to view the condition
3. Note the condition (e.g., "Check if 'subject' contains 'appointment'")
4. Click **Play button** (▶) to execute manually
5. View the execution result

#### Expected Results:
- ✅ Alert shows: "Condition evaluated: false, executed 0 actions"
- ✅ This is expected because manual execution doesn't include trigger data like `subject`
- ✅ Execution log shows the conditional action with status

### Understanding:
- Conditional actions check `triggerData` for specific fields
- Manual execution doesn't provide trigger data, so conditions may evaluate to false
- This is expected behavior - rules are designed to be triggered by actual events (emails, etc.)

---

## Test 5: Email Action Execution

### Steps:
1. Find a rule with a `send_email` action (e.g., "Daily Health Check Reminder")
2. Click **"▶ Show Details"** to see the email configuration
3. Note the recipient email address
4. Execute the rule
5. Check the execution log

#### Expected Results:
- ✅ Alert shows: "send_email: ✅ Email sent successfully to [recipient]"
- ✅ Recent Executions shows the email action with:
  - ✅ status indicator
  - Recipient email address
  - Subject and template info

### Success Criteria:
- [ ] Email action shows as successful in execution log
- [ ] Recipient email is visible in details
- [ ] Email template is shown (if applicable)

---

## Test 6: API Endpoint Testing

### Test Execution Logs API

#### Steps:
1. Open browser developer console (F12)
2. Navigate to: `https://your-vercel-app.vercel.app/api/automation/executions`
3. Or use curl:
   ```bash
   curl -X GET https://your-vercel-app.vercel.app/api/automation/executions \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

#### Expected Results:
- ✅ Returns JSON with:
  - `success: true`
  - `logs`: Array of execution logs
  - `count`: Number of logs

### Test Rule Execution API

#### Steps:
1. Get a rule ID from the UI
2. Execute via API:
   ```bash
   curl -X POST https://your-vercel-app.vercel.app/api/automation/execute \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{"ruleId": "YOUR_RULE_ID"}'
   ```

#### Expected Results:
- ✅ Returns execution log with action details
- ✅ `executionLog` object contains:
  - `status`: success/failed/partial
  - `actions`: Array with action results

---

## Troubleshooting

### Issue: "Recent Executions" section not showing
**Solution**: Execute at least one rule first. The section only appears when there are execution logs.

### Issue: Conditional action shows "executed 0 actions"
**Solution**: This is expected for manual execution. Conditionals need trigger data to evaluate true. Try a rule without conditionals, or the rule needs to be triggered by an actual event (email, etc.).

### Issue: No execution logs visible
**Solution**: 
- Clear browser cache
- Refresh the page
- Execute a rule to generate logs
- Check browser console for errors

### Issue: "Show Details" button not working
**Solution**:
- Check browser console for JavaScript errors
- Try refreshing the page
- Ensure you're on the latest deployment

---

## Success Checklist

After completing all tests, verify:

- [ ] ✅ Rule details can be expanded/collapsed
- [ ] ✅ Execution logs show detailed action results
- [ ] ✅ Recent Executions section displays correctly
- [ ] ✅ Email actions show recipient details
- [ ] ✅ Conditional actions show condition logic
- [ ] ✅ No authentication errors
- [ ] ✅ All API endpoints respond correctly
- [ ] ✅ Execution status indicators work (✅/❌)

---

## Notes

1. **Execution logs are stored in memory** - They reset when the server restarts
2. **Manual execution vs. triggered execution** - Rules triggered by actual events (emails, etc.) will have trigger data, while manual execution may not
3. **Conditional actions** - May evaluate to false when executed manually without proper trigger data
4. **Email actions** - Will only send if SMTP is properly configured in environment variables

---

## Next Steps

After successful testing:
1. Document any issues found
2. Test with real email triggers (if configured)
3. Verify email delivery in your email inbox
4. Test with calendar event creation
5. Consider adding more automation rules for testing

