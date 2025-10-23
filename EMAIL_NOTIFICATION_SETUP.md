# 📧 Email Notification Setup Guide

This guide will help you set up email notifications for calendar events in the Concierge.js application.

## Prerequisites

1. An SMTP email service (Gmail, Outlook, SendGrid, etc.)
2. Access to the Vercel dashboard for environment variables
3. Email credentials for your SMTP service

## Step 1: Choose an SMTP Service

### Option A: Gmail (Recommended for Development)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

### Option B: SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Use SendGrid's SMTP settings

### Option C: Outlook/Hotmail

1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable 2-Factor Authentication
3. Generate an App Password

## Step 2: Set Environment Variables

Add these environment variables to your `.env.local` file and Vercel dashboard:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Gmail Configuration:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### SendGrid Configuration:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Outlook Configuration:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
```

## Step 3: Test Email Configuration

### Test via API:

1. **Check Email Service Status:**
   ```bash
   curl -X GET http://localhost:3000/api/test-email
   ```

2. **Send Test Email:**
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{
       "recipientEmail": "test@example.com",
       "recipientName": "Test User",
       "testType": "appointment_confirmation"
     }'
   ```

### Test via Browser:

1. Go to `http://localhost:3000/api/test-email` to check service status
2. Use the test endpoint to send a test email

## Step 4: Configure Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the SMTP variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_SECURE` | `false` | Use TLS (false for port 587) |
| `SMTP_USER` | `your-email@gmail.com` | Your email address |
| `SMTP_PASS` | `your-app-password` | Your app password |

## Step 5: Test Calendar Notifications

### Create a Calendar Event with Notifications:

```javascript
// Example API call to create event with notification
const response = await fetch('/api/calendar/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'create',
    eventData: {
      title: 'Doctor Appointment',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      location: '123 Main St',
      description: 'Annual checkup'
    },
    sendNotifications: true,
    recipientEmail: 'patient@example.com',
    recipientName: 'John Doe'
  })
});
```

## Email Templates

The system includes pre-built email templates for:

### 📧 Appointment Confirmation
- Sent when an appointment is created
- Includes event details and confirmation message
- Green-themed design

### 🔔 Appointment Reminder
- Sent before appointments (configurable timing)
- Includes event details and reminder message
- Blue-themed design

### ❌ Appointment Cancellation
- Sent when an appointment is cancelled
- Includes original event details
- Red-themed design

### 📝 Appointment Modification
- Sent when an appointment is updated
- Includes new event details
- Yellow-themed design

## Notification Types

The system supports different notification types:

- `appointment_confirmation` - When appointment is created
- `appointment_reminder` - Before appointment (15 min, 1 hour, 1 day)
- `appointment_cancelled` - When appointment is cancelled
- `appointment_modified` - When appointment is updated

## Troubleshooting

### Common Issues:

1. **"Authentication failed" error:**
   - Check that SMTP_USER and SMTP_PASS are correct
   - For Gmail, ensure you're using an App Password, not your regular password
   - Verify 2-Factor Authentication is enabled

2. **"Connection timeout" error:**
   - Check SMTP_HOST and SMTP_PORT
   - Ensure your firewall allows outbound SMTP connections
   - Try different SMTP ports (465 for SSL, 587 for TLS)

3. **"Invalid credentials" error:**
   - Double-check your email and password
   - For Gmail, make sure you generated an App Password
   - For other services, check if you need to enable "Less secure app access"

4. **"Email not received" error:**
   - Check spam/junk folder
   - Verify recipient email address
   - Check SMTP service logs

### Testing the Setup:

1. **Check Environment Variables:**
   ```bash
   # In your terminal
   echo $SMTP_HOST
   echo $SMTP_USER
   ```

2. **Test SMTP Connection:**
   ```bash
   curl -X GET http://localhost:3000/api/test-email
   ```

3. **Send Test Email:**
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"recipientEmail": "your-email@example.com"}'
   ```

## Security Notes

- Never commit SMTP credentials to version control
- Use environment variables for all sensitive data
- Consider using a dedicated email service for production
- Regularly rotate your email passwords
- Monitor email sending limits and quotas

## Production Recommendations

1. **Use a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Set up email templates** for consistent branding
3. **Implement rate limiting** to prevent spam
4. **Add email analytics** to track delivery rates
5. **Set up monitoring** for failed email deliveries

## Support

If you encounter issues:

1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Check your SMTP service documentation
5. Review the troubleshooting section above

## Next Steps

After setting up email notifications:

1. **Configure SMS notifications** (next step)
2. **Set up user notification preferences**
3. **Implement reminder scheduling**
4. **Add email analytics and monitoring**
