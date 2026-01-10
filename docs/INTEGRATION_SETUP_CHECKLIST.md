# Real Integration Setup Checklist

Quick checklist for setting up real email and calendar integration.

## 📧 Email Setup (Choose One)

### Gmail Setup
- [ ] Enable 2-Factor Authentication on Google Account
- [ ] Generate App Password (16 characters)
- [ ] Set environment variables:
  - [ ] `SMTP_HOST=smtp.gmail.com`
  - [ ] `SMTP_PORT=587`
  - [ ] `SMTP_SECURE=false`
  - [ ] `SMTP_USER=your-email@gmail.com`
  - [ ] `SMTP_PASS=your-app-password`
- [ ] Test email connection: `curl http://localhost:3000/api/test-email`
- [ ] Send test email and verify receipt

### SendGrid Setup
- [ ] Create SendGrid account
- [ ] Generate API key
- [ ] Set environment variables:
  - [ ] `SMTP_HOST=smtp.sendgrid.net`
  - [ ] `SMTP_PORT=587`
  - [ ] `SMTP_SECURE=false`
  - [ ] `SMTP_USER=apikey`
  - [ ] `SMTP_PASS=your-api-key`
- [ ] Test email connection
- [ ] Send test email and verify receipt

## 📅 Google Calendar Setup

- [ ] Create Google Cloud Project
- [ ] Enable Google Calendar API
- [ ] Create Service Account
- [ ] Generate Service Account Key (JSON)
- [ ] Share calendar with service account email
- [ ] Set environment variables:
  - [ ] `GOOGLE_CALENDAR_CLIENT_EMAIL` (from JSON)
  - [ ] `GOOGLE_CALENDAR_PRIVATE_KEY` (formatted as single line with `\n`)
- [ ] Test calendar connection: `curl http://localhost:3000/api/test-calendar`
- [ ] Create test calendar event and verify in Google Calendar

## 🧪 Testing

### Email Tests
- [ ] Test email service status
- [ ] Send test appointment confirmation email
- [ ] Send test appointment reminder email
- [ ] Verify emails received and formatted correctly

### Calendar Tests
- [ ] Test calendar API connection
- [ ] Create test calendar event via API
- [ ] Verify event appears in Google Calendar
- [ ] Test event update and deletion

### Automation Tests
- [ ] Create test automation rule with email trigger
- [ ] Create test automation rule with calendar action
- [ ] Execute automation rules
- [ ] Verify execution logs
- [ ] Test end-to-end workflow

## 🚀 Production Deployment

- [ ] Add all environment variables to Vercel
- [ ] Deploy to production
- [ ] Test email in production
- [ ] Test calendar in production
- [ ] Monitor execution logs
- [ ] Set up error monitoring

## 📝 Quick Reference

### Environment Variables Summary

**Email (Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Calendar:**
```env
GOOGLE_CALENDAR_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Test Commands

```bash
# Test email service
curl http://localhost:3000/api/test-email

# Send test email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "test@example.com", "testType": "appointment_confirmation"}'

# Test calendar service
curl http://localhost:3000/api/test-calendar

# Create test calendar event
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "startDate": "2025-11-10T10:00:00Z", "endDate": "2025-11-10T11:00:00Z"}'
```

## 📚 Documentation

- Full guide: [REAL_INTEGRATION_TESTING.md](./REAL_INTEGRATION_TESTING.md)
- Email setup: [EMAIL_NOTIFICATION_SETUP.md](../EMAIL_NOTIFICATION_SETUP.md)
- Calendar setup: [GOOGLE_CALENDAR_SETUP.md](../GOOGLE_CALENDAR_SETUP.md)

