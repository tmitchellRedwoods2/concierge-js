# Real Email and Calendar Integration Testing Guide

This guide will help you set up and test real email and calendar integrations for the automation features.

## 📋 Overview

This guide covers:
- ✅ Setting up real SMTP email service
- ✅ Configuring Google Calendar API
- ✅ Testing email notifications end-to-end
- ✅ Testing calendar event creation and sync
- ✅ Testing automation rules with real services
- ✅ Troubleshooting common issues

## 🎯 Prerequisites

1. **Email Account** (Gmail, Outlook, or SendGrid)
   - For Gmail: Enable 2FA and create an App Password
   - For SendGrid: Create an account and API key

2. **Google Cloud Project** (for Calendar)
   - Google Cloud account
   - Google Calendar API enabled
   - Service account created

3. **Access to Vercel Dashboard**
   - For setting environment variables in production

## 📧 Step 1: Set Up Real Email (SMTP)

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification
   - Enable 2FA

2. **Generate App Password:**
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Concierge App"
   - Copy the 16-character password

3. **Update Environment Variables:**

   **Local (.env.local):**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

   **Vercel (Production):**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add each variable above

### Option B: SendGrid (Recommended for Production)

1. **Sign up at [SendGrid](https://sendgrid.com/)**
2. **Create API Key:**
   - Settings → API Keys → Create API Key
   - Name it "Concierge Production"
   - Copy the API key

3. **Update Environment Variables:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Testing Email Setup

1. **Test Email Service Status:**
   ```bash
   curl http://localhost:3000/api/test-email
   ```

2. **Send Test Email:**
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{
       "recipientEmail": "your-test-email@example.com",
       "recipientName": "Test User",
       "testType": "appointment_confirmation"
     }'
   ```

3. **Check Email Received:**
   - Check inbox (and spam folder)
   - Verify email formatting and content

## 📅 Step 2: Set Up Google Calendar Integration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Concierge Calendar Integration"
3. Enable Google Calendar API:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"

### 2. Create Service Account

1. APIs & Services → Credentials
2. Create Credentials → Service Account
3. Name: `concierge-calendar-service`
4. Click "Create and Continue"
5. Skip optional steps → "Done"

### 3. Generate Service Account Key

1. Click on the service account email
2. Go to "Keys" tab
3. Add Key → Create new key → JSON
4. Download the JSON file

### 4. Share Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Settings → Settings for my calendars
3. Select your calendar → Share with specific people
4. Add the service account email (from JSON file)
5. Permission: "Make changes to events"
6. Save

### 5. Extract Credentials for Vercel

From the downloaded JSON file, extract:
- `client_email` → `GOOGLE_CALENDAR_CLIENT_EMAIL`
- `private_key` → `GOOGLE_CALENDAR_PRIVATE_KEY` (format as single line with `\n`)

**Format for Vercel:**
```env
GOOGLE_CALENDAR_CLIENT_EMAIL=concierge-calendar-service@project-id.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important:** The private key must be on a single line with `\n` characters for line breaks.

### 6. Update Environment Variables

**Local (.env.local):**
```env
GOOGLE_CALENDAR_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Vercel:**
- Add both variables in Vercel Dashboard → Settings → Environment Variables

### Testing Calendar Setup

1. **Test Calendar API Connection:**
   ```bash
   curl http://localhost:3000/api/test-calendar
   ```

2. **Create Test Calendar Event:**
   ```bash
   curl -X POST http://localhost:3000/api/calendar/events \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Appointment",
       "startDate": "2025-11-10T10:00:00Z",
       "endDate": "2025-11-10T11:00:00Z",
       "location": "Test Location",
       "description": "Test event from automation"
     }'
   ```

3. **Verify Event in Google Calendar:**
   - Open Google Calendar
   - Check for the test event
   - Verify event details are correct

## 🧪 Step 3: Test Automation Rules with Real Services

### Test 1: Email Notification Automation

1. **Create an Automation Rule:**
   - Go to Workflows page → Automation Rules tab
   - Click "Create Rule"
   - Name: "Test Email Notification"
   - Trigger: Email (patterns: "test", "appointment")
   - Action: Send Email
   - Configure email template and recipient

2. **Trigger the Rule:**
   - Send a test email or trigger via API
   - Check that email notification is sent

3. **Verify:**
   - Email received in inbox
   - Email content is correct
   - Email formatting is proper

### Test 2: Calendar Event Creation

1. **Create an Automation Rule:**
   - Name: "Test Calendar Event"
   - Trigger: Schedule or Email
   - Action: Create Calendar Event
   - Configure event details

2. **Execute the Rule:**
   - Manually execute or wait for trigger
   - Check execution logs

3. **Verify:**
   - Event appears in Google Calendar
   - Event details are correct
   - Event has proper reminders

### Test 3: End-to-End Workflow

1. **Create Complex Automation:**
   - Trigger: Email with "appointment" keyword
   - Actions:
     1. Create Calendar Event
     2. Send Email Confirmation
     3. Send SMS Reminder (if configured)

2. **Test the Complete Flow:**
   - Trigger via test email or API
   - Verify all actions execute
   - Check execution logs
   - Verify calendar event created
   - Verify email sent

## 📊 Step 4: Test Scenarios

### Scenario 1: Appointment Confirmation Flow

**Setup:**
- Automation rule: Detect appointment emails
- Action: Create calendar event + send confirmation email

**Test:**
1. Send test email with appointment details
2. Verify calendar event created
3. Verify confirmation email sent
4. Check execution logs

**Expected Results:**
- ✅ Calendar event appears in Google Calendar
- ✅ Email received with confirmation
- ✅ Execution log shows success

### Scenario 2: Appointment Reminder Flow

**Setup:**
- Automation rule: Schedule-based reminder
- Action: Send reminder email 1 hour before appointment

**Test:**
1. Create calendar event for 2 hours from now
2. Set up reminder rule
3. Wait for reminder trigger
4. Verify reminder email sent

**Expected Results:**
- ✅ Reminder email sent at correct time
- ✅ Email contains appointment details
- ✅ Execution log shows success

### Scenario 3: Appointment Modification Flow

**Setup:**
- Automation rule: Detect appointment changes
- Action: Update calendar event + send modification email

**Test:**
1. Modify existing calendar event
2. Verify calendar event updated
3. Verify modification email sent

**Expected Results:**
- ✅ Calendar event updated correctly
- ✅ Email sent with new details
- ✅ Execution log shows success

## 🔍 Step 5: Monitoring and Verification

### Check Execution Logs

1. Go to Workflows page → Executions tab
2. Review execution history:
   - Status (success/failed/partial)
   - Action results
   - Error messages (if any)
   - Execution duration

### Monitor Email Delivery

1. Check email inbox regularly
2. Check spam/junk folder
3. Verify email formatting
4. Test different email templates

### Monitor Calendar Events

1. Check Google Calendar regularly
2. Verify event details
3. Check event reminders
4. Verify event attendees (if configured)

## 🐛 Step 6: Troubleshooting

### Email Issues

**Problem: Authentication failed**
- ✅ Check SMTP_USER and SMTP_PASS are correct
- ✅ For Gmail, ensure using App Password (not regular password)
- ✅ Verify 2FA is enabled

**Problem: Email not received**
- ✅ Check spam/junk folder
- ✅ Verify recipient email address
- ✅ Check SMTP service logs
- ✅ Verify email sending limits

**Problem: Connection timeout**
- ✅ Check SMTP_HOST and SMTP_PORT
- ✅ Verify firewall allows SMTP connections
- ✅ Try different ports (465 for SSL, 587 for TLS)

### Calendar Issues

**Problem: Invalid credentials**
- ✅ Check GOOGLE_CALENDAR_CLIENT_EMAIL is correct
- ✅ Verify private key format (single line with `\n`)
- ✅ Ensure service account has correct permissions

**Problem: Calendar not found**
- ✅ Verify calendar is shared with service account
- ✅ Check service account has "Make changes to events" permission
- ✅ Verify Google Calendar API is enabled

**Problem: Insufficient permissions**
- ✅ Ensure service account has correct calendar permissions
- ✅ Verify Google Calendar API is enabled
- ✅ Check service account has access to calendar

## 📝 Step 7: Test Checklist

### Email Integration Tests
- [ ] SMTP connection successful
- [ ] Test email sent and received
- [ ] Appointment confirmation email sent
- [ ] Appointment reminder email sent
- [ ] Appointment cancellation email sent
- [ ] Appointment modification email sent
- [ ] Email templates render correctly
- [ ] Email formatting is proper

### Calendar Integration Tests
- [ ] Google Calendar API connection successful
- [ ] Test calendar event created
- [ ] Event appears in Google Calendar
- [ ] Event details are correct
- [ ] Event reminders are set
- [ ] Event can be updated
- [ ] Event can be deleted

### Automation Rules Tests
- [ ] Email trigger automation works
- [ ] Calendar event creation automation works
- [ ] Email notification automation works
- [ ] Complex automation workflows work
- [ ] Execution logs are accurate
- [ ] Error handling works correctly

## 🚀 Next Steps

After completing real integration testing:

1. **Document any issues found**
2. **Update configuration if needed**
3. **Set up monitoring and alerts**
4. **Create production deployment checklist**
5. **Plan for scaling and performance testing**

## 📚 Additional Resources

- [Email Notification Setup Guide](../EMAIL_NOTIFICATION_SETUP.md)
- [Google Calendar Setup Guide](../GOOGLE_CALENDAR_SETUP.md)
- [Automation Testing Guide](./AUTOMATION_TESTING_GUIDE.md)
- [API Contracts Documentation](./API_CONTRACTS.md)

