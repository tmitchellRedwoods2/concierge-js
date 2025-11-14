# 🧪 System Test Execution Guide

## Current Test Status

### Calendar Sync System Tests

#### ✅ Test 1: Calendar Sync Enabled - Apple Calendar
**Status**: Ready to Execute
**Method**: In-App Test Button

**Steps**:
1. Navigate to Settings → Calendar Settings
2. Ensure:
   - Primary Provider: Apple Calendar
   - Sync Enabled: ✅ (checked)
   - Apple Calendar credentials configured
3. Click "Test Calendar Sync" button
4. Verify:
   - ✅ Test event created successfully
   - ✅ Event synced to Apple Calendar
   - ✅ External Event ID returned
   - ✅ Event appears in Apple Calendar app

**Expected Response**:
```json
{
  "success": true,
  "message": "Test appointment created successfully",
  "appointmentCreated": true,
  "eventId": "...",
  "syncResult": {
    "synced": true,
    "calendarType": "apple",
    "externalEventId": "...",
    "externalEventUrl": "..."
  }
}
```

---

#### ⏳ Test 2: Calendar Sync Disabled
**Status**: Ready to Execute
**Method**: In-App Test Button

**Steps**:
1. Navigate to Settings → Calendar Settings
2. Set:
   - Sync Enabled: ❌ (unchecked)
   - Save preferences
3. Click "Test Calendar Sync" button
4. Verify:
   - ✅ Test event created successfully
   - ⚠️ Sync not enabled message shown
   - ❌ Event NOT synced to external calendar
   - ❌ No external calendar IDs in database

**Expected Response**:
```json
{
  "success": true,
  "appointmentCreated": true,
  "eventId": "...",
  "syncResult": {
    "synced": false,
    "error": "Calendar sync not enabled in user preferences."
  }
}
```

---

#### ⏳ Test 3: Calendar Sync Failure (Non-Blocking)
**Status**: Ready to Execute
**Method**: In-App Test Button with Invalid Credentials

**Steps**:
1. Navigate to Settings → Calendar Settings
2. Configure Apple Calendar with invalid credentials
3. Ensure Sync Enabled: ✅
4. Click "Test Calendar Sync" button
5. Verify:
   - ✅ Test event created successfully (non-blocking)
   - ⚠️ Sync failed but event still created
   - ❌ No external calendar IDs

**Expected Response**:
```json
{
  "success": true,
  "appointmentCreated": true,
  "eventId": "...",
  "syncResult": {
    "synced": false,
    "error": "Apple Calendar sync failed: ..."
  }
}
```

---

#### ⏳ Test 4: Duplicate Prevention
**Status**: Ready to Execute
**Method**: In-App Test Button (Multiple Clicks)

**Steps**:
1. Click "Test Calendar Sync" button (first time)
2. Note the eventId returned
3. Immediately click "Test Calendar Sync" button again
4. Verify:
   - ✅ Second response indicates duplicate
   - ✅ Only ONE event in database
   - ✅ Only ONE event in external calendar

**Expected Response (Second Call)**:
```json
{
  "success": true,
  "message": "Test event already exists (duplicate detected).",
  "eventId": "<same-event-id>",
  "isDuplicate": true
}
```

---

### Email-to-Calendar Workflow Tests

#### ⏳ Test 5: Email Webhook - Valid Appointment
**Status**: Ready to Execute
**Method**: API Call

**Steps**:
1. Send POST request to `/api/email/webhook`:
   ```bash
   curl -X POST http://localhost:3000/api/email/webhook \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: <your-secret>" \
     -d '{
       "userId": "<your-user-id>",
       "from": "dr.smith@example.com",
       "subject": "Appointment Confirmation",
       "body": "Your appointment is scheduled for tomorrow at 2:00 PM at 123 Medical Center Drive, San Francisco, CA."
     }'
   ```
2. Verify:
   - ✅ Event created in database
   - ✅ Event synced to external calendar (if enabled)
   - ✅ Notification email sent
   - ✅ ICS URL in response

---

#### ⏳ Test 6: Email Webhook - Non-Appointment Email
**Status**: Ready to Execute
**Method**: API Call

**Steps**:
1. Send POST request with non-appointment email:
   ```bash
   curl -X POST http://localhost:3000/api/email/webhook \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: <your-secret>" \
     -d '{
       "userId": "<your-user-id>",
       "from": "newsletter@example.com",
       "subject": "Monthly Newsletter",
       "body": "This is our monthly newsletter with updates."
     }'
   ```
2. Verify:
   - ✅ Email processed
   - ❌ No calendar event created
   - ✅ Response indicates no appointment found

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] User logged in
- [ ] Calendar settings page accessible
- [ ] Apple Calendar credentials configured (for sync tests)
- [ ] Sync preferences saved
- [ ] Test environment variables set

### Test Execution Order
1. [ ] Test 1: Calendar Sync Enabled (Apple Calendar)
2. [ ] Test 2: Calendar Sync Disabled
3. [ ] Test 3: Calendar Sync Failure (Non-Blocking)
4. [ ] Test 4: Duplicate Prevention
5. [ ] Test 5: Email Webhook - Valid Appointment
6. [ ] Test 6: Email Webhook - Non-Appointment Email

### Verification Steps (After Each Test)
- [ ] Check database for event creation
- [ ] Check external calendar (if sync enabled)
- [ ] Check notification email (if applicable)
- [ ] Verify response matches expected format
- [ ] Check application logs for errors

---

## Quick Test Commands

### Check User Preferences
```bash
curl http://localhost:3000/api/user/preferences \
  -H "Cookie: <your-session-cookie>"
```

### Check Created Events
```javascript
// In MongoDB shell
db.calendarevents.find({ userId: "<your-user-id>" }).sort({ createdAt: -1 }).limit(5);
```

### Check Sync Status
- Navigate to Settings → Calendar Settings
- Scroll to "Sync Status" section
- View recently synced events

---

## Issues Found

### Issue Log
- **Date**: ___________
- **Test**: ___________
- **Issue**: ___________
- **Status**: [ ] Open / [ ] Fixed / [ ] Won't Fix

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Sync Enabled | ⏳ Pending | |
| Test 2: Sync Disabled | ⏳ Pending | |
| Test 3: Sync Failure | ⏳ Pending | |
| Test 4: Duplicate Prevention | ⏳ Pending | |
| Test 5: Email Webhook Valid | ⏳ Pending | |
| Test 6: Email Webhook Invalid | ⏳ Pending | |

---

**Last Updated**: $(date)
**Tester**: ___________

