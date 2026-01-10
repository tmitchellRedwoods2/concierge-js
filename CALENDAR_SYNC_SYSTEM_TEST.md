# 🧪 Calendar Sync System Test Guide

## 📋 Overview

This guide provides step-by-step instructions for system testing the automatic calendar sync functionality. This feature automatically syncs calendar events created from email triggers to external calendars (Google Calendar, Apple Calendar, etc.) when enabled by the user.

---

## 🎯 What to Test

The calendar sync feature:
1. **Automatically syncs events** created from email triggers to external calendars
2. **Respects user preferences** - only syncs if enabled in user settings
3. **Supports multiple providers** - Google Calendar, Apple Calendar, Outlook, CalDAV
4. **Updates event records** with external calendar IDs and URLs
5. **Handles errors gracefully** - event creation continues even if sync fails

---

## 🔧 Pre-Test Setup

### 1. Environment Configuration

Ensure these environment variables are set:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/concierge-test
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for webhook security)
EMAIL_WEBHOOK_SECRET=your-test-secret

# For Google Calendar sync
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# For email notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### 2. Database Setup

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Create a test user** in your database:
   ```javascript
   // In MongoDB shell or via API
   db.users.insertOne({
     _id: "test-user-123",
     email: "test@example.com",
     name: "Test User"
   });
   ```

### 3. User Preferences Setup

You need to configure calendar sync preferences for your test user. You can do this via:

**Option A: Direct Database Update**
```javascript
// In MongoDB shell
db.userpreferences.insertOne({
  userId: "test-user-123",
  calendarPreferences: {
    syncEnabled: true,
    primaryProvider: "google", // or "apple", "outlook", "caldav"
    googleCalendarConfig: {
      // Google Calendar config if using Google
    },
    appleCalendarConfig: {
      // Apple Calendar config if using Apple
    }
  }
});
```

**Option B: Via API (if you have a preferences endpoint)**
```bash
curl -X POST http://localhost:3000/api/user/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "calendarPreferences": {
      "syncEnabled": true,
      "primaryProvider": "google"
    }
  }'
```

**Option C: Via Application UI**
1. Log in as test user
2. Go to Settings → Calendar Preferences
3. Enable "Sync to External Calendar"
4. Select provider (Google Calendar, Apple Calendar, etc.)
5. Configure credentials if needed

---

## 🧪 Test Scenarios

### **Test 1: Calendar Sync Enabled - Google Calendar**

**Objective**: Verify events are automatically synced to Google Calendar when sync is enabled.

**Prerequisites**:
- User has `calendarPreferences.syncEnabled = true`
- User has `calendarPreferences.primaryProvider = "google"`
- Google Calendar credentials are configured

**Steps**:

1. **Send test email to webhook**:
   ```bash
   curl -X POST http://localhost:3000/api/email/webhook \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: your-test-secret" \
     -d '{
       "userId": "test-user-123",
       "from": "dr.smith@example.com",
       "subject": "Appointment Confirmation",
       "body": "Your appointment is scheduled for January 15, 2024 at 2:00 PM at 123 Medical Center Drive, San Francisco, CA."
     }'
   ```

2. **Verify response**:
   ```json
   {
     "success": true,
     "message": "Appointment created successfully",
     "appointmentCreated": true,
     "eventId": "...",
     "appointment": {
       "title": "...",
       "startDate": "...",
       "endDate": "..."
     }
   }
   ```

3. **Check database** - Verify event was created:
   ```javascript
   // In MongoDB shell
   db.calendarevents.findOne({ userId: "test-user-123" });
   ```
   
   **Expected**: Event document should have:
   - `googleEventId` field populated
   - `googleEventUrl` field populated
   - `source: "email"`

4. **Check Google Calendar**:
   - Log into Google Calendar with the configured account
   - Verify the event appears in the calendar
   - Verify event details match (title, date, time, location)

5. **Check logs**:
   ```bash
   # Look for these log messages:
   # ✅ "📅 Event automatically synced to external calendar: <event-id>"
   # ✅ "📅 Event synced to Google Calendar: <google-event-id>"
   ```

**Success Criteria**:
- ✅ Event created in database
- ✅ Event synced to Google Calendar
- ✅ `googleEventId` and `googleEventUrl` populated in database
- ✅ Event appears in Google Calendar with correct details

---

### **Test 2: Calendar Sync Enabled - Apple Calendar**

**Objective**: Verify events are automatically synced to Apple Calendar when sync is enabled.

**Prerequisites**:
- User has `calendarPreferences.syncEnabled = true`
- User has `calendarPreferences.primaryProvider = "apple"`
- Apple Calendar credentials are configured

**Steps**:

1. **Send test email to webhook** (same as Test 1)

2. **Verify response** (same as Test 1)

3. **Check database** - Verify event was created:
   ```javascript
   db.calendarevents.findOne({ userId: "test-user-123" });
   ```
   
   **Expected**: Event document should have:
   - `appleEventId` field populated
   - `appleEventUrl` field populated
   - `source: "email"`

4. **Check Apple Calendar**:
   - Open Calendar.app (macOS) or iCloud Calendar (web)
   - Verify the event appears in the calendar
   - Verify event details match

5. **Check logs**:
   ```bash
   # Look for:
   # ✅ "📅 Event automatically synced to external calendar: <event-id>"
   # ✅ "📅 Event synced to Apple Calendar: <apple-event-id>"
   ```

**Success Criteria**:
- ✅ Event created in database
- ✅ Event synced to Apple Calendar
- ✅ `appleEventId` and `appleEventUrl` populated in database
- ✅ Event appears in Apple Calendar with correct details

---

### **Test 3: Calendar Sync Disabled**

**Objective**: Verify events are NOT synced when sync is disabled.

**Prerequisites**:
- User has `calendarPreferences.syncEnabled = false`

**Steps**:

1. **Send test email to webhook** (same as Test 1)

2. **Verify response** (same as Test 1)

3. **Check database**:
   ```javascript
   db.calendarevents.findOne({ userId: "test-user-123" });
   ```
   
   **Expected**: Event document should:
   - ✅ Be created successfully
   - ❌ NOT have `googleEventId` or `appleEventId`
   - ❌ NOT have `googleEventUrl` or `appleEventUrl`

4. **Check external calendar**:
   - Verify event does NOT appear in Google/Apple Calendar

5. **Check logs**:
   ```bash
   # Look for:
   # ✅ "📅 Calendar sync disabled for user: test-user-123"
   ```

**Success Criteria**:
- ✅ Event created in database
- ✅ Event NOT synced to external calendar
- ✅ No external calendar IDs/URLs in database
- ✅ Event does not appear in external calendar

---

### **Test 4: Calendar Sync Failure (Non-Blocking)**

**Objective**: Verify event creation continues even if calendar sync fails.

**Prerequisites**:
- User has `calendarPreferences.syncEnabled = true`
- Calendar provider credentials are invalid or service is unavailable

**Steps**:

1. **Send test email to webhook** (same as Test 1)

2. **Verify response**:
   ```json
   {
     "success": true,  // Should still be true
     "message": "Appointment created successfully",
     "appointmentCreated": true
   }
   ```

3. **Check database**:
   ```javascript
   db.calendarevents.findOne({ userId: "test-user-123" });
   ```
   
   **Expected**: Event document should:
   - ✅ Be created successfully
   - ❌ NOT have external calendar IDs/URLs

4. **Check logs**:
   ```bash
   # Look for:
   # ⚠️ "Calendar sync not enabled or failed (non-blocking): <error>"
   # ⚠️ "Calendar sync error (non-blocking): <error>"
   ```

**Success Criteria**:
- ✅ Event created in database (sync failure doesn't block creation)
- ✅ Error logged but doesn't crash the system
- ✅ User receives notification email (if notification service works)

---

### **Test 5: Multiple Events - No Duplicates**

**Objective**: Verify duplicate events are not created or synced.

**Steps**:

1. **Send first email**:
   ```bash
   curl -X POST http://localhost:3000/api/email/webhook \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: your-test-secret" \
     -d '{
       "userId": "test-user-123",
       "from": "dr.smith@example.com",
       "subject": "Appointment Confirmation",
       "body": "Your appointment is scheduled for January 15, 2024 at 2:00 PM."
     }'
   ```

2. **Send identical email again** (same content)

3. **Check database**:
   ```javascript
   db.calendarevents.find({ userId: "test-user-123" }).count();
   ```
   
   **Expected**: Should return `1` (not 2)

4. **Check response**:
   ```json
   {
     "success": true,
     "message": "Duplicate appointment detected and skipped.",
     "eventId": "<existing-event-id>"
   }
   ```

5. **Check external calendar**:
   - Verify only ONE event appears in external calendar

**Success Criteria**:
- ✅ Only one event created in database
- ✅ Duplicate detection works correctly
- ✅ Only one event synced to external calendar

---

### **Test 6: Event Created via Automation Engine**

**Objective**: Verify events created via automation engine also sync.

**Prerequisites**:
- User has calendar sync enabled
- Automation rule configured

**Steps**:

1. **Create automation rule** (via API or UI):
   ```javascript
   {
     name: "Email Calendar Rule",
     trigger: { type: "email", conditions: {} },
     actions: [{
       type: "create_calendar_event",
       config: {
         title: "Test Event",
         startDate: "2024-01-15T14:00:00Z",
         endDate: "2024-01-15T15:00:00Z",
         location: "Test Location"
       }
     }],
     enabled: true,
     userId: "test-user-123"
   }
   ```

2. **Trigger the rule** (send email or trigger manually)

3. **Verify event synced**:
   - Check database for `googleEventId` or `appleEventId`
   - Check external calendar for the event

**Success Criteria**:
- ✅ Event created via automation engine
- ✅ Event synced to external calendar
- ✅ External calendar IDs/URLs populated

---

## 🔍 Verification Checklist

After running each test, verify:

### Database Verification
- [ ] Event created in `calendarevents` collection
- [ ] Event has correct `userId`
- [ ] Event has `source: "email"` (for email-triggered events)
- [ ] If sync enabled: `googleEventId` or `appleEventId` populated
- [ ] If sync enabled: `googleEventUrl` or `appleEventUrl` populated
- [ ] Event details match email content (title, date, time, location)

### External Calendar Verification
- [ ] Event appears in external calendar (if sync enabled)
- [ ] Event title matches
- [ ] Event date/time matches
- [ ] Event location matches (if provided)
- [ ] Event description includes doctor name (if available)

### Log Verification
- [ ] Success logs: "📅 Event automatically synced to external calendar"
- [ ] No error logs (unless testing error scenarios)
- [ ] Error logs present and clear (when testing error scenarios)

### API Response Verification
- [ ] Response status: `200 OK`
- [ ] Response includes `success: true`
- [ ] Response includes `eventId`
- [ ] Response includes appointment details

---

## 🐛 Troubleshooting

### Issue: Events not syncing

**Check**:
1. User preferences: `calendarPreferences.syncEnabled = true`
2. Provider configured: `calendarPreferences.primaryProvider` set correctly
3. Credentials valid: Google/Apple credentials are correct
4. Logs: Check for error messages

**Debug**:
```javascript
// Check user preferences
db.userpreferences.findOne({ userId: "test-user-123" });

// Check event
db.calendarevents.findOne({ userId: "test-user-123" });

// Check logs for errors
```

### Issue: Sync fails but event still created

**This is expected behavior!** Sync failures are non-blocking. Check logs for the specific error:
```bash
# Look for:
# ⚠️ "Calendar sync not enabled or failed (non-blocking): <error>"
```

### Issue: Duplicate events in external calendar

**Check**:
1. Duplicate detection working in database
2. Sync only happens once per event
3. Check if multiple webhook calls were made

---

## 📊 Test Data

### Sample Test Emails

**Email 1: Standard Appointment**
```json
{
  "from": "dr.smith@example.com",
  "subject": "Appointment Confirmation",
  "body": "Your appointment is scheduled for January 15, 2024 at 2:00 PM at 123 Medical Center Drive, San Francisco, CA."
}
```

**Email 2: Appointment with Doctor Name**
```json
{
  "from": "Dr. Johnson <dr.johnson@example.com>",
  "subject": "Your appointment with Dr. Johnson",
  "body": "Your appointment is scheduled for tomorrow at 10:00 AM. Please arrive 15 minutes early."
}
```

**Email 3: Appointment with Multiple Dates**
```json
{
  "from": "scheduler@example.com",
  "subject": "Appointment Options",
  "body": "We have availability on January 15, 2024 at 2 PM or January 20, 2024 at 10 AM. Which works for you?"
}
```

---

## ✅ Success Criteria

### Functional Requirements
- [ ] Events automatically sync when `syncEnabled = true`
- [ ] Events do NOT sync when `syncEnabled = false`
- [ ] Sync works for Google Calendar
- [ ] Sync works for Apple Calendar
- [ ] Event creation continues even if sync fails
- [ ] External calendar IDs/URLs stored in database
- [ ] Duplicate events not created or synced

### Performance Requirements
- [ ] Sync completes in < 2 seconds
- [ ] Event creation not blocked by sync
- [ ] System handles sync failures gracefully

### User Experience Requirements
- [ ] Events appear in external calendar with correct details
- [ ] Users can click external calendar URL to view event
- [ ] Sync happens automatically (no user action required)

---

## 📝 Test Execution Log

Use this template to track your test execution:

```
Date: ___________
Tester: ___________

Test 1: Google Calendar Sync
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 2: Apple Calendar Sync
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 3: Sync Disabled
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 4: Sync Failure (Non-Blocking)
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 5: Duplicate Prevention
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 6: Automation Engine Sync
- [ ] Pass / [ ] Fail
- Notes: ___________

Overall Result: [ ] Pass / [ ] Fail
Issues Found: ___________
```

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Ready for Testing

