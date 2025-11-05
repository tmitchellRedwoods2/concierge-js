# Test Execution Guide - Quick Reference

This guide provides quick reference steps for executing the automation test plan.

---

## 🚀 Quick Start

1. **Navigate to Automation Rules**: Go to `/workflows` → "Automation Rules" tab
2. **Setup Demo Rules**: Click "Setup Demo Rules" button
3. **Verify Rules**: Check that 6+ rules appear in the list
4. **Start Testing**: Follow the test suites in order

---

## 📋 Test Execution Order

### **Phase 1: UI Functionality (Test Suite 1)**
1. Access Automation Rules Tab
2. Verify empty state (if no rules)
3. Setup demo rules
4. View rules list
5. Toggle rules on/off
6. Execute rules manually
7. Delete a test rule

**Key Features to Verify**:
- ✅ "Show Details" button expands/collapses rule configuration
- ✅ Execution logs show in "Recent Executions" section
- ✅ Alert dialogs show detailed execution results

---

### **Phase 2: Email Triggers (Test Suite 2)**
1. Create email trigger rule
2. Test pattern matching via API:
   ```bash
   curl -X POST https://your-app.vercel.app/api/automation/triggers/email \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{
       "from": "test@example.com",
       "subject": "Your medical appointment is scheduled",
       "body": "Your annual physical is scheduled for next Tuesday at 2 PM.",
       "patterns": ["appointment", "doctor", "medical"]
     }'
   ```
3. Verify rules trigger
4. Test case-insensitive matching
5. Test multiple patterns

**Key Features to Verify**:
- ✅ Email patterns match correctly
- ✅ Rules execute when patterns match
- ✅ Execution logs show triggered rules

---

### **Phase 3: Smart Scheduling (Test Suite 3)**
1. Create scheduling rule with preferences
2. Test auto-scheduling via API:
   ```bash
   curl -X POST https://your-app.vercel.app/api/automation/smart-schedule \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{
       "title": "Test Meeting",
       "duration": 60,
       "type": "meeting"
     }'
   ```
3. Verify optimal time selected
4. Test with conflicts
5. Test without rules (fallback)

**Key Features to Verify**:
- ✅ Optimal times found
- ✅ Conflicts avoided
- ✅ Calendar events created

---

### **Phase 4: Rule Actions (Test Suite 4)**
1. **Email Action**: Execute rule with email action
   - Check execution log shows: "✅ send_email: Email sent successfully to [recipient]"
   - Verify recipient email in details
   
2. **Calendar Event Action**: Execute rule with calendar event action
   - Check execution log shows: "✅ create_calendar_event: Calendar event created"
   - Verify event title in details
   
3. **Wait Action**: Execute rule with delay
   - Time the execution
   - Verify delay occurs
   
4. **Conditional Action**: Execute rule with conditional
   - Check condition evaluation in execution log
   - Verify correct action path executed

**Key Features to Verify**:
- ✅ All action types execute correctly
- ✅ Execution logs show action details
- ✅ Status indicators (✅/❌) are correct

---

### **Phase 5: API Endpoints (Test Suite 5)**
Test all API endpoints systematically:

1. **GET /api/automation/rules** - List rules
2. **POST /api/automation/rules** - Create rule
3. **PUT /api/automation/rules/[ruleId]** - Update rule
4. **DELETE /api/automation/rules/[ruleId]** - Delete rule
5. **POST /api/automation/execute** - Execute rule
6. **POST /api/automation/smart-schedule** - Smart schedule
7. **POST /api/automation/setup-demo** - Setup demo
8. **POST /api/automation/triggers/email** - Process email

**Key Features to Verify**:
- ✅ All endpoints respond correctly
- ✅ Authentication required where needed
- ✅ Error handling works

---

### **Phase 6: Integration Scenarios (Test Suite 6)**
1. **Medical Appointment Flow**: 
   - Setup demo rules
   - Process email with appointment keywords
   - Verify calendar event created
   - Verify confirmation email sent
   
2. **Daily Health Reminder**:
   - Execute daily health reminder rule
   - Verify email sent
   
3. **Meeting Follow-up**:
   - Create calendar event
   - Wait for end time
   - Verify follow-up email sent
   
4. **Multi-Action Rule**:
   - Create rule with multiple actions
   - Execute and verify all actions run

**Key Features to Verify**:
- ✅ End-to-end flows work correctly
- ✅ Multiple actions execute in sequence
- ✅ Integration between systems works

---

### **Phase 7: Error Handling (Test Suite 7)**
1. Test invalid rule configurations
2. Try to execute disabled rule
3. Try to execute non-existent rule
4. Process email with no matching rules
5. Test smart scheduling with no available times

**Key Features to Verify**:
- ✅ Appropriate error messages
- ✅ Graceful error handling
- ✅ No crashes or undefined behavior

---

### **Phase 8: Performance (Test Suite 8)**
1. Create 10+ rules
2. Execute multiple rules simultaneously
3. Process multiple emails concurrently
4. Create 50+ rules and test UI performance

**Key Features to Verify**:
- ✅ Performance acceptable
- ✅ No race conditions
- ✅ UI remains responsive

---

## 🔍 Verification Checklist

After each test, verify:

- [ ] **Execution Logs**: Check "Recent Executions" section
- [ ] **Action Details**: Verify action results show in logs
- [ ] **Status Indicators**: Check ✅/❌ indicators are correct
- [ ] **Rule Details**: Use "Show Details" to verify configuration
- [ ] **No Errors**: Check browser console for errors
- [ ] **API Responses**: Verify API returns correct data

---

## 📝 Testing Tips

1. **Use Browser DevTools**: Check console for errors, network tab for API calls
2. **Take Screenshots**: Capture execution logs, rule details, error messages
3. **Document Issues**: Note any unexpected behavior or errors
4. **Test Edge Cases**: Try invalid inputs, missing data, etc.
5. **Verify Execution Logs**: Always check the "Recent Executions" section

---

## 🐛 Common Issues

### Issue: Execution logs not showing
**Solution**: 
- Execute at least one rule first
- Refresh the page
- Check browser console for errors

### Issue: Conditional evaluates to false
**Solution**: 
- This is expected for manual execution without trigger data
- Use rules without conditionals, or trigger via email

### Issue: Email not sent
**Solution**: 
- Check SMTP configuration in environment variables
- Verify recipient email in rule configuration
- Check execution log for email action status

### Issue: API returns 401
**Solution**: 
- Ensure you're logged in
- Check session cookie is valid
- Verify authentication headers

---

## ✅ Success Indicators

- ✅ All rules execute successfully
- ✅ Execution logs show detailed action results
- ✅ Email actions show recipient details
- ✅ Calendar events are created correctly
- ✅ Conditional actions evaluate correctly
- ✅ Error handling works gracefully
- ✅ Performance is acceptable

---

## 📊 Test Completion Checklist

- [ ] All test suites completed
- [ ] All tests documented in TEST_EXECUTION_RESULTS.md
- [ ] Issues logged with details
- [ ] Screenshots captured (if applicable)
- [ ] Test summary completed
- [ ] Success criteria verified

---

Good luck with your testing! 🚀

