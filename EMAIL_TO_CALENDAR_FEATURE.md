# 📧➡️📅 Automated Email-to-Calendar Workflow Feature

## 🎯 Feature Overview

This feature enables **fully automated appointment scheduling** by detecting appointment emails from doctors, extracting appointment details, creating calendar events, and notifying users with one-click Apple Calendar integration. **Zero manual interaction required.**

---

## 🚀 What Was Built

### 1. **Email Parser Service** (`src/lib/services/email-parser.ts`)

**Purpose**: Intelligently extracts appointment details from natural language email content.

**Key Capabilities**:
- ✅ **Smart Detection**: Identifies appointment emails using keyword matching (appointment, doctor, medical, checkup, etc.)
- ✅ **Date Extraction**: Parses dates from multiple formats:
  - ISO: `2024-01-15T10:00:00Z`
  - US Format: `01/15/2024` or `01-15-2024`
  - Month Name: `January 15, 2024`
  - Relative: `today`, `tomorrow`, `next week`
- ✅ **Time Extraction**: Handles both 12-hour (`2:30 PM`) and 24-hour (`14:30`) formats
- ✅ **Doctor Name Extraction**: Extracts from email headers, subject, or body
- ✅ **Location Extraction**: Finds addresses and medical facility names
- ✅ **Confidence Scoring**: Calculates 0-1 confidence score based on data quality
- ✅ **Title Generation**: Creates meaningful event titles from email content
- ✅ **Description Building**: Combines doctor name, location, and email content

**Example Input**:
```
From: Dr. Smith <dr.smith@example.com>
Subject: Appointment Confirmation
Body: Your appointment is scheduled for January 15, 2024 at 2:00 PM at 123 Medical Center Drive.
```

**Example Output**:
```typescript
{
  title: "Appointment with Dr. Smith",
  startDate: Date("2024-01-15T14:00:00Z"),
  endDate: Date("2024-01-15T15:00:00Z"),
  location: "123 Medical Center Drive",
  doctorName: "Dr. Smith",
  doctorEmail: "dr.smith@example.com",
  confidence: 0.9
}
```

---

### 2. **Email Webhook Endpoint** (`src/app/api/email/webhook/route.ts`)

**Purpose**: Receives incoming emails from email services and automatically processes them.

**Key Capabilities**:
- ✅ **Multi-Format Support**: Handles SendGrid, Mailgun, and generic email formats
- ✅ **Security**: Webhook secret verification (`x-webhook-secret` header)
- ✅ **Automatic Processing**: Parses email → Creates event → Sends notification
- ✅ **Duplicate Prevention**: Checks for existing events before creating
- ✅ **Error Handling**: Graceful handling of parsing failures, database errors
- ✅ **Integration**: Works with existing automation trigger system

**API Endpoint**: `POST /api/email/webhook`

**Request Format** (SendGrid):
```json
{
  "from": "doctor@example.com",
  "subject": "Appointment Confirmation",
  "text": "Your appointment is scheduled...",
  "userId": "user-123"
}
```

**Response Format**:
```json
{
  "success": true,
  "appointmentCreated": true,
  "eventId": "event-123",
  "icsUrl": "https://app.com/api/calendar/event/event-123/ics",
  "appointment": {
    "title": "Appointment with Dr. Smith",
    "startDate": "2024-01-15T14:00:00Z",
    "confidence": 0.9
  }
}
```

---

### 3. **Enhanced Automation Engine** (`src/lib/services/automation-engine.ts`)

**Purpose**: Automatically creates calendar events from email triggers with full integration.

**Key Enhancements**:
- ✅ **Source Tracking**: Marks events as `source: 'email'` for analytics
- ✅ **ICS URL Generation**: Automatically generates ICS download URLs
- ✅ **Notification Integration**: Sends notifications when events created from emails
- ✅ **Context Preservation**: Maintains email context in automation execution logs

**Workflow**:
1. Email trigger matches → Automation rule executes
2. `create_calendar_event` action runs
3. Event created with email source
4. ICS URL generated and included in response
5. Notification sent with ICS download link

---

### 4. **Enhanced Email Notifications** (`src/lib/services/email-notification.ts`)

**Purpose**: Sends user-friendly notifications with one-click calendar integration.

**Key Features**:
- ✅ **Prominent Button**: Large "Add to Apple Calendar" button in HTML emails
- ✅ **ICS Download Link**: Direct link to download .ics file
- ✅ **Event Details**: Complete event information (title, date, time, location)
- ✅ **Helpful Tips**: Instructions for users if auto-open doesn't work
- ✅ **Plain Text Fallback**: Full information in plain text version

**Email Template Includes**:
- ✅ Appointment confirmation header
- ✅ Event title and details
- ✅ Date and time (formatted)
- ✅ Location (if available)
- ✅ Description
- ✅ **"Add to Apple Calendar" button** (prominent, green)
- ✅ Direct event details link
- ✅ Helpful tips for users

---

### 5. **ICS File Generation** (`src/app/api/calendar/event/[eventId]/ics/route.ts`)

**Purpose**: Generates iCalendar (.ics) files for Apple Calendar and other calendar apps.

**Key Features**:
- ✅ **iCalendar Standard**: Compliant with RFC 5545
- ✅ **Proper Formatting**: CRLF line breaks (`\r\n`) as required
- ✅ **Special Character Escaping**: Commas, semicolons, backslashes properly escaped
- ✅ **Complete Event Data**: Title, dates, location, description, attendees
- ✅ **HTTP Headers**: Proper `Content-Type` and `Content-Disposition` headers
- ✅ **RFC 5987 Encoding**: Filename encoding for browser compatibility

**API Endpoint**: `GET /api/calendar/event/[eventId]/ics`

**Response Headers**:
```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="event-123.ics"; filename*=UTF-8''event-123.ics
Content-Transfer-Encoding: binary
```

---

## 🔄 Complete Workflow

### **User Journey** (Fully Automated)

1. **Doctor Sends Email** → Email service (SendGrid/Mailgun) receives email
2. **Webhook Triggered** → Email forwarded to `/api/email/webhook`
3. **Email Parsed** → Parser extracts appointment details (date, time, doctor, location)
4. **Event Created** → Calendar event automatically saved to database
5. **Notification Sent** → User receives email with "Add to Apple Calendar" button
6. **User Clicks Button** → ICS file downloads and opens in Calendar.app
7. **Event Added** → Appointment appears in user's calendar

**Total User Interaction**: **1 click** (to add to calendar)

---

## 📊 Technical Details

### **Files Created/Modified**

**New Files**:
- `src/lib/services/email-parser.ts` - Email parsing service
- `src/app/api/email/webhook/route.ts` - Email webhook endpoint
- `src/app/api/calendar/event/[eventId]/auto-add/route.ts` - Auto-add endpoint
- `src/__tests__/services/email-parser.test.ts` - Unit tests (17 tests)
- `src/__tests__/api/email/webhook.test.ts` - Integration tests

**Modified Files**:
- `src/lib/services/automation-engine.ts` - Enhanced for email triggers
- `src/lib/services/email-notification.ts` - Added ICS download links
- `src/lib/services/notification-service.ts` - Enhanced notification sending
- `src/__tests__/services/automation-engine.test.ts` - Added email trigger tests

### **Dependencies**
- No new external dependencies required
- Uses existing: `nodemailer`, `mongoose`, `next-auth`

### **Environment Variables**
```bash
EMAIL_WEBHOOK_SECRET=your-secret-here  # For webhook security
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For ICS URL generation
```

---

## 🎯 Key Benefits

### **For Users**
- ✅ **Zero Manual Work**: No copying/pasting appointment details
- ✅ **One-Click Integration**: Add to calendar with single button click
- ✅ **Never Miss Appointments**: Automatic calendar entry
- ✅ **Time Savings**: Saves 2-3 minutes per appointment

### **For System**
- ✅ **Automated Workflow**: Reduces manual data entry
- ✅ **Data Accuracy**: Reduces human error in date/time entry
- ✅ **Scalability**: Handles unlimited appointment emails
- ✅ **Integration Ready**: Works with existing automation system

---

## 🔒 Security Features

- ✅ **Webhook Secret Verification**: Prevents unauthorized access
- ✅ **User ID Validation**: Ensures events created for correct user
- ✅ **Input Sanitization**: Email content sanitized before processing
- ✅ **Error Handling**: No sensitive data exposed in error messages

---

## 📈 Success Metrics

### **Accuracy Targets**
- Date/Time Extraction: **95%+ accuracy**
- Doctor Name Extraction: **90%+ accuracy**
- Location Extraction: **85%+ accuracy**
- Overall Event Creation: **90%+ success rate**

### **Performance Targets**
- Email Processing: **< 2 seconds**
- Event Creation: **< 500ms**
- Notification Sending: **< 1 second**
- ICS File Generation: **< 100ms**

---

## 🚧 Known Limitations

1. **Browser Compatibility**: ICS auto-open works best on macOS Safari. Chrome/Firefox may require manual file opening.
2. **Date Ambiguity**: Relative dates like "next Monday" interpreted based on current date.
3. **Multiple Appointments**: Currently creates one event per email. Multiple appointments may need manual review.
4. **Time Zone**: Uses server timezone. User-specific timezones may need enhancement.

---

## 🔮 Future Enhancements

### **Potential Improvements**
- [ ] Support for multiple appointments in one email
- [ ] User timezone detection and conversion
- [ ] Calendar sync (Google Calendar, Outlook) in addition to Apple Calendar
- [ ] Appointment modification detection (reschedule, cancel)
- [ ] Machine learning for improved parsing accuracy
- [ ] Multi-language support
- [ ] Appointment confirmation requests

---

## 📚 Documentation

- **System Test Plan**: See `SYSTEM_TEST_PLAN.md`
- **API Documentation**: See inline code comments
- **Unit Tests**: See `src/__tests__/services/email-parser.test.ts`
- **Integration Tests**: See `src/__tests__/api/email/webhook.test.ts`

---

## ✅ Testing Status

- ✅ **Unit Tests**: 17/17 passing (Email Parser)
- ✅ **Integration Tests**: All passing (Webhook, Automation)
- ✅ **Code Coverage**: Comprehensive test coverage
- ⏳ **System Tests**: Ready for execution (see SYSTEM_TEST_PLAN.md)

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: ✅ Ready for Production Testing

