# 🧪 System Test Plan: Automated Email-to-Calendar Workflow

## 📋 Overview

This document outlines the comprehensive system test plan for the new automated email-to-calendar workflow functionality. This feature automatically detects appointment emails from doctors, extracts appointment details, creates calendar events, and notifies users with one-click Apple Calendar integration.

---

## 🎯 New Functionality Summary

### 1. **Email Parser Service** (`email-parser.ts`)
   - **Purpose**: Intelligently extracts appointment details from email content
   - **Capabilities**:
     - Detects appointment keywords (appointment, doctor, medical, checkup, etc.)
     - Extracts dates and times from various formats (ISO, MM/DD/YYYY, "January 15, 2024", "today", "tomorrow")
     - Parses doctor/provider names from email headers and content
     - Extracts locations/addresses from email body
     - Generates event titles and descriptions
     - Calculates confidence scores for extracted data
     - Handles 12-hour and 24-hour time formats

### 2. **Email Webhook Endpoint** (`/api/email/webhook`)
   - **Purpose**: Receives incoming emails from email services (SendGrid, Mailgun, etc.)
   - **Capabilities**:
     - Supports multiple email service formats (SendGrid, Mailgun, generic)
     - Webhook secret verification for security
     - Automatically parses emails and creates calendar events
     - Prevents duplicate event creation
     - Sends notifications with ICS download links
     - Processes emails through automation trigger system

### 3. **Enhanced Automation Engine**
   - **Purpose**: Automatically creates calendar events from email triggers
   - **Capabilities**:
     - Creates calendar events with proper source tracking ("email", "workflow", "manual")
     - Generates ICS URLs for Apple Calendar integration
     - Sends notifications when events are created from emails
     - Includes ICS download links in event creation details

### 4. **Enhanced Email Notifications**
   - **Purpose**: Notify users when appointments are automatically created
   - **Capabilities**:
     - HTML and plain text email templates
     - Prominent "Add to Apple Calendar" button with ICS download link
     - Event details (title, date, time, location, description)
     - Helpful tips for users

### 5. **ICS File Generation** (`/api/calendar/event/[eventId]/ics`)
   - **Purpose**: Generate iCalendar (.ics) files for Apple Calendar integration
   - **Capabilities**:
     - Proper iCalendar format with CRLF line breaks
     - Escapes special characters correctly
     - Includes all event details (title, dates, location, description, attendees)
     - Sets proper HTTP headers for browser/OS recognition
     - RFC 5987 encoding for filename preservation

---

## 🧪 System Test Plan

### **Phase 1: Email Parsing Accuracy Tests**

#### Test 1.1: Date Format Recognition
- [ ] **ISO Format**: `2024-01-15T10:00:00Z`
- [ ] **US Format**: `01/15/2024` or `01-15-2024`
- [ ] **Month Name Format**: `January 15, 2024`
- [ ] **Relative Dates**: `today`, `tomorrow`, `next week`
- [ ] **Date in Subject**: Extract date from email subject line
- [ ] **Date in Body**: Extract date from email body
- [ ] **Multiple Dates**: Select the most relevant future date

**Expected Results**: All date formats correctly parsed and converted to Date objects

#### Test 1.2: Time Extraction
- [ ] **12-Hour Format**: `10:00 AM`, `2:30 PM`
- [ ] **24-Hour Format**: `14:30`, `09:00`
- [ ] **Time with Minutes**: `2:30 PM` → 14:30
- [ ] **Time without Minutes**: `2 PM` → 14:00
- [ ] **No Time Specified**: Defaults to 9:00 AM or marks as all-day

**Expected Results**: Times correctly extracted and converted to 24-hour format

#### Test 1.3: Doctor/Provider Name Extraction
- [ ] **From Email Header**: `Dr. Smith <dr.smith@example.com>`
- [ ] **From Subject**: `Appointment with Dr. Smith`
- [ ] **From Body**: `Your appointment with Dr. Johnson is scheduled`
- [ ] **Multiple Doctors**: Extract the primary doctor mentioned

**Expected Results**: Doctor names correctly extracted and included in event description

#### Test 1.4: Location Extraction
- [ ] **Street Address**: `123 Main Street, San Francisco, CA`
- [ ] **Medical Center**: `Medical Center Drive`
- [ ] **Clinic Name**: `ABC Medical Clinic`
- [ ] **No Location**: Gracefully handles missing location

**Expected Results**: Locations extracted when present, event created without location if not found

#### Test 1.5: Confidence Scoring
- [ ] **High Confidence** (0.8-1.0): Date + Time + Doctor + Location
- [ ] **Medium Confidence** (0.5-0.7): Date + Time + (Doctor OR Location)
- [ ] **Low Confidence** (0.3-0.5): Date only
- [ ] **Very Low Confidence** (<0.3): Should not create event automatically

**Expected Results**: Confidence scores accurately reflect data quality

---

### **Phase 2: Email Webhook Integration Tests**

#### Test 2.1: Webhook Security
- [ ] **Valid Secret**: Request with correct `x-webhook-secret` header succeeds
- [ ] **Invalid Secret**: Request with wrong secret returns 401
- [ ] **Missing Secret** (when configured): Returns 401
- [ ] **No Secret Required**: Works when `EMAIL_WEBHOOK_SECRET` not set

**Expected Results**: Proper authentication and authorization

#### Test 2.2: Email Format Support
- [ ] **SendGrid Format**: `{ from, subject, text, html }`
- [ ] **Mailgun Format**: `{ sender, subject, body-plain, body-html }`
- [ ] **Generic Format**: `{ from, subject, body }`
- [ ] **Invalid Format**: Returns 400 with error message

**Expected Results**: All supported formats correctly parsed

#### Test 2.3: Appointment Detection & Creation
- [ ] **Valid Appointment Email**: Creates calendar event successfully
- [ ] **Non-Appointment Email**: Processes through trigger system but doesn't create event
- [ ] **Duplicate Prevention**: Doesn't create duplicate if event already exists
- [ ] **Missing User ID**: Returns 400 error

**Expected Results**: Events created only for valid appointments, duplicates prevented

#### Test 2.4: Notification Delivery
- [ ] **Notification Sent**: User receives email notification
- [ ] **ICS Link Included**: Notification contains "Add to Apple Calendar" button
- [ ] **Event Details**: Notification includes all event information
- [ ] **Notification Failure**: Event still created even if notification fails

**Expected Results**: Notifications sent with complete information, graceful error handling

---

### **Phase 3: End-to-End Workflow Tests**

#### Test 3.1: Complete Email-to-Calendar Flow
**Test Scenario**: Doctor sends appointment email → System processes → User receives notification

**Steps**:
1. Send test email to webhook endpoint with appointment details
2. Verify email is parsed correctly
3. Verify calendar event is created in database
4. Verify notification email is sent
5. Verify ICS file is accessible via URL
6. Verify event appears in user's calendar view

**Expected Results**: Complete workflow executes without manual intervention

#### Test 3.2: Multiple Appointment Formats
- [ ] **Formal Email**: "Your appointment with Dr. Smith is scheduled for January 15, 2024 at 2:00 PM at 123 Medical Center"
- [ ] **Casual Email**: "Hey, your checkup is tomorrow at 10am"
- [ ] **Calendar Invite**: Email with embedded calendar attachment
- [ ] **Reminder Email**: "Reminder: Your appointment is today at 3 PM"

**Expected Results**: All formats correctly parsed and events created

#### Test 3.3: Edge Cases
- [ ] **Past Dates**: Email with appointment in the past (should still create event)
- [ ] **Ambiguous Dates**: "Next Monday" (should use context)
- [ ] **Multiple Appointments**: Email mentioning multiple dates
- [ ] **Incomplete Information**: Missing date, time, or location
- [ ] **Special Characters**: Event titles with commas, semicolons, backslashes

**Expected Results**: Graceful handling of edge cases, events created when possible

---

### **Phase 4: ICS File Generation & Download Tests**

#### Test 4.1: ICS File Format
- [ ] **Valid iCalendar Format**: File starts with `BEGIN:VCALENDAR` and ends with `END:VCALENDAR`
- [ ] **CRLF Line Breaks**: Uses `\r\n` as required by iCalendar spec
- [ ] **Special Character Escaping**: Commas, semicolons, backslashes properly escaped
- [ ] **Date Format**: Dates in `YYYYMMDDTHHMMSSZ` format
- [ ] **UID Present**: Each event has unique UID

**Expected Results**: Valid ICS file that can be imported into any calendar application

#### Test 4.2: ICS File Download
- [ ] **Direct Download**: Clicking ICS URL downloads file
- [ ] **Filename Extension**: File has `.ics` extension
- [ ] **Content-Type Header**: `text/calendar; charset=utf-8`
- [ ] **Content-Disposition**: Properly sets filename
- [ ] **macOS Auto-Open**: File automatically opens in Calendar.app (if configured)

**Expected Results**: ICS file downloads correctly and opens in calendar application

#### Test 4.3: Apple Calendar Integration
- [ ] **Event Opens in Calendar.app**: On macOS, ICS file opens automatically
- [ ] **Event Details Correct**: Title, date, time, location all correct
- [ ] **Attendees Included**: Email addresses added as attendees
- [ ] **Description Preserved**: Full description text included

**Expected Results**: Event correctly imported into Apple Calendar with all details

---

### **Phase 5: Error Handling & Resilience Tests**

#### Test 5.1: Database Errors
- [ ] **Connection Failure**: Gracefully handles MongoDB connection errors
- [ ] **Save Failure**: Returns appropriate error message
- [ ] **Query Failure**: Handles event lookup failures

**Expected Results**: Errors logged, user-friendly error messages returned

#### Test 5.2: Email Service Errors
- [ ] **Notification Service Down**: Event still created, error logged
- [ ] **Invalid Email Address**: Handles gracefully
- [ ] **SMTP Errors**: Logs error, continues processing

**Expected Results**: System continues to function even when email service fails

#### Test 5.3: Invalid Input Handling
- [ ] **Malformed Email**: Returns 400 with clear error
- [ ] **Missing Required Fields**: Returns 400 with field list
- [ ] **Invalid Date Format**: Logs warning, attempts to parse
- [ ] **Empty Email Body**: Handles gracefully

**Expected Results**: Clear error messages, no system crashes

---

### **Phase 6: Performance & Load Tests**

#### Test 6.1: Single Email Processing
- [ ] **Response Time**: Email processed in < 2 seconds
- [ ] **Database Write**: Event saved in < 500ms
- [ ] **Notification Send**: Email sent in < 1 second

**Expected Results**: Fast response times for single email processing

#### Test 6.2: Concurrent Email Processing
- [ ] **10 Simultaneous Emails**: All processed successfully
- [ ] **100 Simultaneous Emails**: System handles load gracefully
- [ ] **No Duplicate Events**: Even with concurrent processing

**Expected Results**: System handles concurrent requests without errors or duplicates

#### Test 6.3: Large Email Bodies
- [ ] **10KB Email**: Processes correctly
- [ ] **100KB Email**: Handles without timeout
- [ ] **HTML Email**: Extracts text content correctly

**Expected Results**: Handles emails of various sizes efficiently

---

### **Phase 7: User Experience Tests**

#### Test 7.1: Notification Email Appearance
- [ ] **HTML Rendering**: Email displays correctly in email clients
- [ ] **Button Visibility**: "Add to Apple Calendar" button is prominent
- [ ] **Mobile Responsive**: Email looks good on mobile devices
- [ ] **Plain Text Fallback**: Plain text version includes all information

**Expected Results**: Professional, user-friendly email notifications

#### Test 7.2: One-Click Calendar Addition
- [ ] **Button Click**: Downloads ICS file
- [ ] **File Opens**: Automatically opens in Calendar.app (macOS)
- [ ] **Event Added**: Event appears in user's calendar
- [ ] **No Manual Steps**: User doesn't need to rename file or manually import

**Expected Results**: Seamless one-click experience for users

#### Test 7.3: Error Recovery
- [ ] **Failed Download**: User can retry
- [ ] **Direct Link**: Fallback link available if button doesn't work
- [ ] **Clear Instructions**: User knows what to do if auto-open fails

**Expected Results**: Users can always add event to calendar, even if auto-open fails

---

## 📊 Test Data Requirements

### Sample Email Templates

1. **Standard Appointment Email**
   ```
   From: Dr. Smith <dr.smith@example.com>
   Subject: Appointment Confirmation
   Body: Your appointment is scheduled for January 15, 2024 at 2:00 PM at 123 Medical Center Drive, San Francisco, CA.
   ```

2. **Casual Appointment Email**
   ```
   From: clinic@example.com
   Subject: Your checkup is tomorrow
   Body: Hey, just a reminder that your checkup is tomorrow at 10am. See you then!
   ```

3. **Appointment with Multiple Dates**
   ```
   From: scheduler@example.com
   Subject: Appointment Options
   Body: We have availability on January 15, 2024 at 2 PM or January 20, 2024 at 10 AM. Which works for you?
   ```

4. **Appointment Reminder**
   ```
   From: noreply@example.com
   Subject: Reminder: Appointment Today
   Body: This is a reminder that your appointment with Dr. Johnson is today at 3:00 PM.
   ```

---

## ✅ Success Criteria

### Functional Requirements
- [ ] 95%+ accuracy in date/time extraction
- [ ] 90%+ accuracy in doctor name extraction
- [ ] 85%+ accuracy in location extraction
- [ ] 100% of valid appointment emails create calendar events
- [ ] 0% duplicate events created
- [ ] 100% of created events generate valid ICS files
- [ ] 100% of notifications include ICS download links

### Performance Requirements
- [ ] Email processing: < 2 seconds
- [ ] Event creation: < 500ms
- [ ] Notification sending: < 1 second
- [ ] ICS file generation: < 100ms
- [ ] System handles 100 concurrent emails without errors

### User Experience Requirements
- [ ] One-click calendar addition works on macOS
- [ ] Email notifications are clear and actionable
- [ ] Error messages are user-friendly
- [ ] Fallback options available if auto-open fails

---

## 🐛 Known Issues & Limitations

1. **Browser Compatibility**: ICS auto-open works best on macOS Safari. Chrome/Firefox may require manual file opening.
2. **Date Ambiguity**: Relative dates like "next Monday" may be interpreted based on current date context.
3. **Multiple Appointments**: Currently creates one event per email. Multiple appointments in one email may need manual review.
4. **Time Zone**: Uses server timezone. May need enhancement for user-specific timezones.

---

## 📝 Test Execution Checklist

### Pre-Test Setup
- [ ] Test email service configured (SendGrid/Mailgun webhook)
- [ ] Test database with sample user data
- [ ] Test email addresses configured
- [ ] Webhook secret set in environment variables
- [ ] Notification service configured (SMTP settings)

### Test Execution
- [ ] Run all Phase 1 tests (Email Parsing)
- [ ] Run all Phase 2 tests (Webhook Integration)
- [ ] Run all Phase 3 tests (End-to-End)
- [ ] Run all Phase 4 tests (ICS Generation)
- [ ] Run all Phase 5 tests (Error Handling)
- [ ] Run all Phase 6 tests (Performance)
- [ ] Run all Phase 7 tests (User Experience)

### Post-Test
- [ ] Document any failures
- [ ] Verify all events created correctly
- [ ] Check notification emails received
- [ ] Verify ICS files open correctly
- [ ] Clean up test data

---

## 🔄 Regression Testing

After any changes to the email-to-calendar workflow, re-run:
- [ ] Phase 1: Email Parsing Accuracy (critical)
- [ ] Phase 3: End-to-End Workflow (critical)
- [ ] Phase 4: ICS File Generation (critical)
- [ ] Phase 5: Error Handling (important)

---

## 📞 Support & Escalation

If tests fail:
1. Check application logs for detailed error messages
2. Verify email service webhook configuration
3. Check database connectivity
4. Verify environment variables are set correctly
5. Review ICS file format manually
6. Test with different email formats

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Ready for Testing

