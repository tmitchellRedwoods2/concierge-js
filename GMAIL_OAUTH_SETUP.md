# 📧 Gmail OAuth Setup Guide

This guide will walk you through setting up Gmail OAuth integration for autonomous email scanning.

## 🎯 Prerequisites

- A Google account
- Access to Google Cloud Console

## 📋 Step-by-Step Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Concierge Email Integration")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

### Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"** from the results
4. Click **"Enable"**
5. Wait for the API to be enabled

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account, then use "Internal")
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Concierge Email Integration (or your app name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On the **"Scopes"** page, click **"Add or Remove Scopes"**
7. Search for and add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
8. Click **"Update"**, then **"Save and Continue"**
9. On the **"Test users"** page (if in Testing mode):
   - Click **"Add Users"**
   - Add your email address (and any other test users)
   - Click **"Add"**
10. Click **"Save and Continue"** through the remaining pages

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, select **"Web application"** as the application type
5. Fill in the details:
   - **Name**: Concierge Gmail Integration (or any name you prefer)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/email/oauth/gmail/callback` (for local development)
     - `https://your-production-domain.com/api/email/oauth/gmail/callback` (for production)
6. Click **"Create"**
7. **IMPORTANT**: A popup will appear with your **Client ID** and **Client Secret**
   - Copy both values immediately (you won't be able to see the secret again!)
   - If you lose the secret, you'll need to create new credentials

### Step 5: Add Credentials to Your Environment

Add the credentials to your `.env.local` file (or `.env` for production):

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**⚠️ Security Note**: Never commit these values to git! Make sure `.env.local` is in your `.gitignore`.

### Step 6: Verify Setup

1. Restart your Next.js development server
2. Go to `/settings/email-scanning` in your app
3. Click **"Connect Gmail"**
4. You should be redirected to Google's OAuth consent screen
5. After authorizing, you'll be redirected back to your app

## 🔒 Security Best Practices

1. **Keep credentials secret**: Never share or commit your Client Secret
2. **Use environment variables**: Store credentials in `.env.local` (local) or Vercel environment variables (production)
3. **Restrict redirect URIs**: Only add the exact URIs you'll use
4. **Review OAuth consent**: Make sure your app name and scopes are clear to users
5. **Monitor usage**: Check Google Cloud Console regularly for unusual activity

## 🚀 Production Deployment

### For Vercel:

1. Go to your Vercel project settings
2. Navigate to **"Environment Variables"**
3. Add:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret
4. Update the **Authorized redirect URIs** in Google Cloud Console to include your production domain:
   - `https://your-app.vercel.app/api/email/oauth/gmail/callback`
5. Redeploy your application

### For Other Platforms:

1. Add the environment variables to your hosting platform's configuration
2. Update the redirect URIs in Google Cloud Console
3. Restart/redeploy your application

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error

This is the most common error. The redirect URI must match **exactly** between what your app sends and what's configured in Google Cloud Console.

**To fix this:**

1. **Find the actual redirect URI being used:**
   - Check your Vercel deployment logs (or local server logs)
   - Look for the log message: `🔗 Gmail OAuth redirect URI:`
   - Copy the exact URI shown (e.g., `https://your-app.vercel.app/api/email/oauth/gmail/callback`)

2. **Add it to Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **"APIs & Services"** → **"Credentials"**
   - Click on your OAuth 2.0 Client ID
   - Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
   - Paste the exact URI from step 1 (must match exactly, including `https://` and no trailing slash)
   - Click **"Save"**

3. **Common issues:**
   - ❌ Trailing slash: `https://app.com/api/.../callback/` (wrong) vs `https://app.com/api/.../callback` (correct)
   - ❌ Protocol mismatch: `http://` vs `https://`
   - ❌ Domain mismatch: `localhost:3000` vs production domain
   - ❌ Path mismatch: `/api/email/oauth/gmail/callback` must match exactly

4. **For Vercel deployments:**
   - The redirect URI will be: `https://YOUR-VERCEL-URL.vercel.app/api/email/oauth/gmail/callback`
   - Or if you have a custom domain: `https://yourdomain.com/api/email/oauth/gmail/callback`
   - Check your Vercel deployment URL in the Vercel dashboard
   - Add BOTH the preview URL and production URL if needed

### "invalid_client" Error

- Verify your Client ID and Client Secret are correct
- Make sure they're in the correct environment variables
- Restart your server after adding environment variables

### "access_denied" Error

- Make sure you've added your email as a test user (if app is in Testing mode)
- Check that you've requested the correct scopes
- Verify the OAuth consent screen is properly configured

### Token Refresh Issues

- Make sure you're requesting `access_type: 'offline'` (already included in the code)
- Users may need to re-authorize if they revoked access

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist

- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Client Secret copied
- [ ] Environment variables added to `.env.local`
- [ ] Redirect URIs configured correctly
- [ ] Test user added (if in Testing mode)
- [ ] Server restarted
- [ ] OAuth flow tested successfully

Once you've completed these steps, your Gmail OAuth integration will be ready to use! 🎉

