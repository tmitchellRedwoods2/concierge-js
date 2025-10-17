# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for the workflow system.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Calendar account
3. Access to the Vercel dashboard for environment variables

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `concierge-calendar-service`
   - Descripti`Service account for Concierge calendar integration`on: 
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 3: Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file

## Step 4: Share Calendar with Service Account

1. Open Google Calendar
2. Go to your calendar settings
3. Share your calendar with the service account email (found in the JSON file)
4. Give it "Make changes to events" permission

## Step 5: Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add the following variables:

```
GOOGLE_CALENDAR_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The private key should include the `\n` characters as shown
- Make sure to wrap the private key in quotes
- The private key should be on a single line with `\n` for line breaks

## Step 6: Test the Integration

1. Deploy your application
2. Go to the Workflows page
3. Execute a workflow
4. Check the Executions tab for calendar event creation
5. Verify the event appears in your Google Calendar

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error:**
   - Check that the environment variables are set correctly
   - Ensure the private key includes `\n` characters
   - Verify the service account email is correct

2. **"Calendar not found" error:**
   - Make sure you've shared your calendar with the service account
   - Check that the service account has the correct permissions

3. **"Insufficient permissions" error:**
   - Ensure the service account has "Make changes to events" permission
   - Verify the Google Calendar API is enabled

### Testing the Setup:

You can test the calendar integration by:

1. Using the workflow execution API directly
2. Checking the browser console for error messages
3. Verifying events appear in your Google Calendar

## Security Notes

- Never commit the service account JSON file to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your service account keys
- Monitor API usage in the Google Cloud Console

## Support

If you encounter issues:
1. Check the Google Cloud Console for API errors
2. Review the Vercel function logs
3. Verify all environment variables are set correctly
4. Test with a simple calendar event creation first
