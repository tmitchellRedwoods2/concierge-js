# Automation Features - Test Plan

## 📋 **Feature Summary**

The Automation system provides intelligent, rule-based automation capabilities integrated into the Workflows page. It enables users to create automation rules that trigger actions based on various conditions.

---

## 🎯 **Core Capabilities**

### **1. Automation Engine**
- **Purpose**: Core engine that manages and executes automation rules
- **Features**:
  - Create, update, delete automation rules
  - Enable/disable rules dynamically
  - Execute rules manually or automatically
  - Track rule execution statistics
  - Queue-based execution system

### **2. Email Trigger System**
- **Purpose**: Automatically process incoming emails and trigger rules based on patterns
- **Features**:
  - Pattern-based email matching (case-insensitive)
  - Multiple pattern support per trigger
  - User-specific trigger filtering
  - Automatic rule execution when patterns match

### **3. Smart Scheduler**
- **Purpose**: Intelligently schedule events based on user preferences and existing calendar
- **Features**:
  - Find optimal meeting times
  - Consider user preferences (work hours, days of week, preferred times)
  - Avoid conflicts with existing events
  - Score and rank time slots
  - Auto-schedule events with confidence scores

### **4. Automation Templates**
- **Purpose**: Pre-built automation rules for common scenarios
- **Templates Available**:
  - Medical appointment reminders
  - Doctor appointment detection
  - Meeting follow-ups
  - Medication reminders
  - Exercise reminders
  - Bill reminders
  - Investment checks

### **5. Action Types**
- **Send Email**: Send automated email notifications
- **Send SMS**: Send SMS notifications (integration ready)
- **Create Calendar Event**: Automatically create calendar events
- **Update Calendar Event**: Modify existing calendar events
- **Webhook Call**: Call external webhooks
- **Wait/Delay**: Add delays between actions
- **Conditional Logic**: Execute different actions based on conditions

### **6. UI Integration**
- **Location**: Workflows page → "Automation Rules" tab
- **Features**:
  - View all automation rules
  - Create new rules
  - Enable/disable rules with toggle switch
  - Execute rules manually
  - Delete rules
  - View execution statistics
  - Setup demo rules with one click

---

## 🧪 **System Test Plan**

### **Test Environment Setup**
1. Navigate to `/workflows` page
2. Ensure you're logged in
3. Navigate to "Automation Rules" tab
4. Clear any existing test rules

---

### **Test Suite 1: UI Functionality**

#### **Test 1.1: Access Automation Rules Tab**
- **Steps**:
  1. Navigate to `/workflows`
  2. Click on "Automation Rules" tab
  3. Verify tab is active and displays automation interface
- **Expected**: Automation Rules tab displays with empty state or existing rules

#### **Test 1.2: Empty State Display**
- **Steps**:
  1. Ensure no automation rules exist
  2. Navigate to Automation Rules tab
- **Expected**: 
  - Empty state message displayed
  - "Setup Demo Rules" button visible
  - Helpful description text shown

#### **Test 1.3: Setup Demo Rules**
- **Steps**:
  1. Click "Setup Demo Rules" button
  2. Wait for confirmation
  3. Refresh page
- **Expected**:
  - Alert/notification showing demo rules created
  - 6+ automation rules appear in the list
  - Rules show as "Active" or "Inactive"

#### **Test 1.4: View Automation Rules**
- **Steps**:
  1. After demo setup, view the rules list
- **Expected**:
  - Each rule displays:
    - Name
    - Description
    - Active/Inactive badge
    - Trigger type
    - Action count
    - Execution count
    - Last run date
  - Rules are sorted/organized clearly

#### **Test 1.5: Toggle Rule Enable/Disable**
- **Steps**:
  1. Find a rule in the list
  2. Click the toggle switch to disable
  3. Verify state changes
  4. Toggle back to enable
- **Expected**:
  - Badge changes from "Active" to "Inactive"
  - Toggle switch reflects state
  - Change persists after page refresh

#### **Test 1.6: Execute Rule Manually**
- **Steps**:
  1. Find a rule with manual execution button
  2. Click execute/play button
  3. Observe execution
- **Expected**:
  - Success message/notification
  - Execution count increments
  - Last run date updates
  - Any configured actions execute (email sent, event created, etc.)

#### **Test 1.7: Delete Rule**
- **Steps**:
  1. Click delete button on a test rule
  2. Confirm deletion in dialog
  3. Verify rule removed
- **Expected**:
  - Confirmation dialog appears
  - Rule removed from list after confirmation
  - Rule does not appear after page refresh

---

### **Test Suite 2: Email Trigger Functionality**

#### **Test 2.1: Create Email Trigger Rule**
- **Steps**:
  1. Create a rule with email trigger
  2. Set patterns: ["appointment", "doctor", "medical"]
  3. Configure action to send email
  4. Save rule
- **Expected**:
  - Rule created successfully
  - Email trigger configured properly
  - Rule appears in list

#### **Test 2.2: Process Email with Matching Pattern**
- **Steps**:
  1. Send test email with subject "Your medical appointment is scheduled"
  2. Email body contains "appointment" and "doctor"
  3. Verify rule triggers
- **Expected**:
  - Email processed successfully
  - Matching patterns detected
  - Automation rule executes
  - Email sent to recipient (if configured)

#### **Test 2.3: Process Email with Non-Matching Pattern**
- **Steps**:
  1. Send test email with subject "Weekly Newsletter"
  2. Email does not contain trigger patterns
- **Expected**:
  - Email processed but no rules triggered
  - No automation actions execute

#### **Test 2.4: Case-Insensitive Pattern Matching**
- **Steps**:
  1. Create rule with pattern "APPOINTMENT"
  2. Send email with "appointment" (lowercase)
- **Expected**:
  - Pattern matches despite case difference
  - Rule executes

#### **Test 2.5: Multiple Pattern Matching**
- **Steps**:
  1. Create rule with patterns: ["appointment", "urgent", "medical"]
  2. Send email containing multiple patterns
- **Expected**:
  - All matching patterns detected
  - Rule executes with matched patterns logged

---

### **Test Suite 3: Smart Scheduling**

#### **Test 3.1: Create Smart Scheduling Rule**
- **Steps**:
  1. Create scheduling rule with preferences:
     - Work hours: 9 AM - 5 PM
     - Days: Monday-Friday
     - Preferred times: 10:00, 14:00
     - Avoid times: 12:00 (lunch)
  2. Save rule
- **Expected**:
  - Rule created successfully
  - Preferences saved correctly

#### **Test 3.2: Auto-Schedule Event with Rules**
- **Steps**:
  1. Call `/api/automation/smart-schedule` endpoint
  2. Request: 60-minute meeting tomorrow
  3. Verify optimal time selected
- **Expected**:
  - Event scheduled within work hours
  - Time avoids lunch hour (12:00-13:00)
  - Preferred time slots prioritized
  - Calendar event created

#### **Test 3.3: Auto-Schedule with Conflicts**
- **Steps**:
  1. Create existing calendar event at 2 PM
  2. Request to schedule 1-hour meeting
  3. Preferred time would conflict
- **Expected**:
  - Smart scheduler finds alternative time
  - No conflicts with existing events
  - Event scheduled successfully

#### **Test 3.4: Auto-Schedule with No Rules**
- **Steps**:
  1. Remove all scheduling rules
  2. Request to auto-schedule event
- **Expected**:
  - Falls back to basic scheduling
  - Event still scheduled
  - Uses current time or preferred time

---

### **Test Suite 4: Rule Actions**

#### **Test 4.1: Email Action**
- **Steps**:
  1. Create rule with "send_email" action
  2. Configure recipient, subject, template
  3. Execute rule
- **Expected**:
  - Email sent successfully
  - Correct recipient receives email
  - Email content matches template
  - Email contains expected data

#### **Test 4.2: Create Calendar Event Action**
- **Steps**:
  1. Create rule with "create_calendar_event" action
  2. Configure event details (title, date, location)
  3. Execute rule
- **Expected**:
  - Calendar event created
  - Event appears in calendar
  - Event details correct (title, date, location)

#### **Test 4.3: Wait/Delay Action**
- **Steps**:
  1. Create rule with multiple actions
  2. Add "wait" action between actions (5 seconds)
  3. Execute rule and time execution
- **Expected**:
  - Delay occurs between actions
  - Wait time matches configured duration
  - Actions execute in correct order

#### **Test 4.4: Conditional Action**
- **Steps**:
  1. Create rule with conditional logic
  2. Set condition: if email contains "urgent"
  3. Configure different actions for true/false cases
  4. Execute with urgent email
  5. Execute with non-urgent email
- **Expected**:
  - Correct action path executed based on condition
  - Different outcomes for true/false branches

---

### **Test Suite 5: API Endpoints**

#### **Test 5.1: GET /api/automation/rules**
- **Steps**:
  1. Call GET endpoint
  2. Verify authentication required
- **Expected**:
  - Returns list of user's automation rules
  - Includes rule details (name, trigger, actions, stats)
  - 401 if not authenticated

#### **Test 5.2: POST /api/automation/rules**
- **Steps**:
  1. Create new rule via API
  2. Include required fields (name, trigger, actions)
  3. Verify rule created
- **Expected**:
  - Rule created successfully
  - Returns rule ID
  - Rule appears in UI
  - 400 error if missing required fields

#### **Test 5.3: PUT /api/automation/rules/[ruleId]**
- **Steps**:
  1. Toggle rule enabled/disabled via API
  2. Verify state change
- **Expected**:
  - Rule state updated
  - Status reflected in UI
  - 404 if rule not found

#### **Test 5.4: DELETE /api/automation/rules/[ruleId]**
- **Steps**:
  1. Delete rule via API
  2. Verify deletion
- **Expected**:
  - Rule deleted successfully
  - Rule removed from UI
  - 404 if rule not found

#### **Test 5.5: POST /api/automation/execute**
- **Steps**:
  1. Execute rule via API
  2. Include rule ID and optional trigger data
- **Expected**:
  - Rule executes successfully
  - Actions performed
  - Execution count increments
  - 400 if rule not found or disabled

#### **Test 5.6: POST /api/automation/smart-schedule**
- **Steps**:
  1. Request smart scheduling
  2. Include event details (title, duration, type)
- **Expected**:
  - Optimal time found
  - Event created
  - Returns event details
  - 400 if missing required fields

#### **Test 5.7: POST /api/automation/setup-demo**
- **Steps**:
  1. Call demo setup endpoint
  2. Verify multiple rules created
- **Expected**:
  - 6+ demo rules created
  - Rules configured correctly
  - Success message returned

#### **Test 5.8: POST /api/automation/triggers/email**
- **Steps**:
  1. Process test email via endpoint
  2. Include email content with matching patterns
- **Expected**:
  - Email processed
  - Matching rules triggered
  - Actions executed

---

### **Test Suite 6: Integration Scenarios**

#### **Test 6.1: Medical Appointment Detection Flow**
- **Steps**:
  1. Setup demo rules (includes medical appointment detection)
  2. Simulate email: "Your annual physical is scheduled for next Tuesday"
  3. Verify automation flow
- **Expected**:
  - Email pattern matched
  - Calendar event created automatically
  - Confirmation email sent
  - Event appears in calendar

#### **Test 6.2: Daily Health Reminder**
- **Steps**:
  1. Setup demo rules (includes daily health reminder)
  2. Wait for scheduled execution (or trigger manually)
- **Expected**:
  - Reminder email sent at configured time
  - Email contains health check information
  - Execution tracked

#### **Test 6.3: Meeting Follow-up Automation**
- **Steps**:
  1. Create calendar event (meeting)
  2. Wait for meeting end time
  3. Verify follow-up automation triggers
- **Expected**:
  - Follow-up email sent after meeting ends
  - Email contains meeting summary/action items
  - Proper delay before sending

#### **Test 6.4: Multi-Action Rule**
- **Steps**:
  1. Create rule with multiple actions:
     - Create calendar event
     - Wait 5 seconds
     - Send email notification
  2. Execute rule
- **Expected**:
  - All actions execute in sequence
  - Delay works correctly
  - Final email sent after delay

---

### **Test Suite 7: Error Handling & Edge Cases**

#### **Test 7.1: Invalid Rule Configuration**
- **Steps**:
  1. Attempt to create rule with missing required fields
  2. Attempt to create rule with invalid trigger type
  3. Attempt to create rule with invalid action type
- **Expected**:
  - Appropriate error messages
  - Rule not created
  - 400 status codes

#### **Test 7.2: Execute Disabled Rule**
- **Steps**:
  1. Disable a rule
  2. Attempt to execute it via API
- **Expected**:
  - Execution fails
  - Error message indicates rule is disabled
  - No actions executed

#### **Test 7.3: Execute Non-Existent Rule**
- **Steps**:
  1. Attempt to execute rule with invalid ID
- **Expected**:
  - 400/404 error
  - Clear error message
  - No actions executed

#### **Test 7.4: Email Trigger with No Matching Rules**
- **Steps**:
  1. Send email with no matching patterns
  2. Verify processing
- **Expected**:
  - Email processed successfully
  - No rules triggered
  - No errors thrown

#### **Test 7.5: Smart Scheduling with No Available Times**
- **Steps**:
  1. Create rule with very restrictive preferences
  2. Create events that block all preferred times
  3. Attempt to auto-schedule
- **Expected**:
  - Graceful handling
  - Either finds alternative time or returns null
  - Clear error message if no time available

---

### **Test Suite 8: Performance & Concurrency**

#### **Test 8.1: Multiple Rules Execution**
- **Steps**:
  1. Create 10+ automation rules
  2. Trigger multiple rules simultaneously
  3. Monitor execution
- **Expected**:
  - All rules execute successfully
  - No conflicts or race conditions
  - Execution queue handles load

#### **Test 8.2: Concurrent Email Processing**
- **Steps**:
  1. Send 5+ emails simultaneously
  2. Each matches different rules
  3. Verify processing
- **Expected**:
  - All emails processed
  - All matching rules triggered
  - No duplicate executions

#### **Test 8.3: Large Number of Rules**
- **Steps**:
  1. Create 50+ automation rules
  2. View rules list
  3. Execute rules
- **Expected**:
  - UI remains responsive
  - Rules display correctly
  - Execution performance acceptable

---

## ✅ **Test Execution Checklist**

### **Pre-Testing**
- [ ] Test environment configured
- [ ] User account logged in
- [ ] Email service configured (SendGrid/Gmail)
- [ ] Calendar integration working
- [ ] Clean test data state

### **Functional Testing**
- [ ] UI functionality tests (Suite 1)
- [ ] Email trigger tests (Suite 2)
- [ ] Smart scheduling tests (Suite 3)
- [ ] Action execution tests (Suite 4)
- [ ] API endpoint tests (Suite 5)

### **Integration Testing**
- [ ] Medical appointment flow (Test 6.1)
- [ ] Daily reminder flow (Test 6.2)
- [ ] Meeting follow-up flow (Test 6.3)
- [ ] Multi-action rule flow (Test 6.4)

### **Error Handling**
- [ ] Invalid configurations (Test 7.1)
- [ ] Disabled rules (Test 7.2)
- [ ] Non-existent resources (Test 7.3)
- [ ] Edge cases (Tests 7.4-7.5)

### **Performance**
- [ ] Multiple rules execution (Test 8.1)
- [ ] Concurrent email processing (Test 8.2)
- [ ] Large dataset handling (Test 8.3)

---

## 📊 **Success Criteria**

### **Functional Success**
- ✅ All automation rules execute correctly
- ✅ Email triggers match patterns and execute rules
- ✅ Smart scheduling finds optimal times
- ✅ All action types work as expected
- ✅ UI displays rules and statistics correctly

### **Integration Success**
- ✅ Rules integrate with email system
- ✅ Rules integrate with calendar system
- ✅ Rules integrate with notification system
- ✅ Multi-step workflows execute properly

### **Quality Success**
- ✅ Error handling works correctly
- ✅ Edge cases handled gracefully
- ✅ Performance acceptable under load
- ✅ UI remains responsive

---

## 🔧 **Test Data & Setup**

### **Test Email Addresses**
- Primary test email: `test@example.com`
- Secondary test email: `automation-test@example.com`

### **Sample Email Content**
```
Subject: Your medical appointment is scheduled
Body: Your annual physical examination is scheduled for next Tuesday at 2:00 PM. 
Please arrive 15 minutes early and bring your insurance card.
```

### **Sample Calendar Events**
- Meeting: 60 minutes, weekday, 10 AM - 5 PM window
- Medical Appointment: 30 minutes, any day, flexible timing
- Blocked Times: Create conflicts to test smart scheduling

### **Demo Rules Setup**
Use the "Setup Demo Rules" button to create:
1. Daily Health Check Reminder
2. Medical Appointment Detection
3. Meeting Follow-up
4. Medication Reminder
5. Smart Scheduling Rule
6. Email Trigger Rule

---

## 📝 **Test Reporting Template**

For each test:
- **Test ID**: [e.g., Test 1.1]
- **Test Name**: [Test description]
- **Status**: ✅ PASS / ❌ FAIL / ⚠️ BLOCKED
- **Notes**: [Any observations, issues, or screenshots]
- **Screenshots**: [If applicable]
- **Browser/Environment**: [e.g., Chrome 120, macOS]

---

## 🚨 **Known Issues & Workarounds**

### **Potential Issues**
1. **Rule Persistence**: Rules are stored in memory (Map) - will be lost on server restart
   - **Workaround**: For testing, create rules fresh each session
   - **Future**: Will be migrated to database

2. **Cron Scheduling**: Simplified implementation - not production-ready
   - **Workaround**: Use manual execution for scheduled rules
   - **Future**: Will integrate proper cron library

3. **Email Trigger**: Requires manual email processing endpoint call
   - **Workaround**: Use `/api/automation/triggers/email` endpoint to test
   - **Future**: Will integrate with email service

---

## 📚 **Additional Resources**

- **API Documentation**: `/docs/API_CONTRACTS.md`
- **Automation Testing Guide**: `/docs/AUTOMATION_TESTING_GUIDE.md`
- **Code Location**: `src/lib/services/automation-engine.ts`
- **UI Location**: `src/app/workflows/page.tsx` (Automation Rules tab)

---

**Good luck with your testing!** 🚀

