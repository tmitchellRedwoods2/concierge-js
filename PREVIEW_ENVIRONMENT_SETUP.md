# Preview Environment Setup Guide

## Why Users Don't Exist in Preview Environments

**Vercel Preview Deployments use separate databases from Production.**

When you create a pull request or push to a branch, Vercel creates a preview deployment that:
- Uses a **separate database** (if configured)
- Or uses the **same database** but with isolated data
- Requires users to be created separately

## The Problem

Users created in:
- ✅ **Production** - exist in production database
- ✅ **Local** - exist in local database  
- ❌ **Preview** - **DO NOT automatically exist** in preview database

This is why `jmagner` can log in to production but not to preview deployments.

## Solution: Automatic Preview User Setup

### Option 1: Use the Setup Endpoint (Recommended)

After deploying to preview, call:

```bash
# Check which users exist
curl https://your-preview-url.vercel.app/api/admin/setup-preview-users

# Create missing users
curl -X POST https://your-preview-url.vercel.app/api/admin/setup-preview-users
```

This will:
- Check which essential users exist
- Create missing users (like `jmagner`)
- Work automatically in preview environments

### Option 2: Manual Setup via API

Use the jmagner-specific endpoint:

```bash
# Check if user exists
curl https://your-preview-url.vercel.app/api/admin/users/jmagner

# Create the user (requires admin auth in production, open in preview)
curl -X POST https://your-preview-url.vercel.app/api/admin/users/jmagner \
  -H "Content-Type: application/json" \
  -d '{
    "password": "jm71Concierge!",
    "email": "jmagner@concierge.com",
    "firstName": "John",
    "lastName": "Magner",
    "plan": "premium",
    "role": "client",
    "accessMode": "self-service"
  }'
```

### Option 3: Add to Vercel Build Hook

You can automate this by adding a build hook that runs after deployment:

1. Go to Vercel Dashboard → Project → Settings → Git
2. Add a "Deploy Hook" that calls the setup endpoint
3. Or add it to your `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/admin/setup-preview-users",
      "destination": "/api/admin/setup-preview-users"
    }
  ]
}
```

## Essential Users

The following users are automatically created in preview environments:

- `jmagner` - Primary user account
- (Add more as needed)

## Database Configuration

### Same Database for All Environments

If you want preview to use the **same database** as production:

1. In Vercel, go to Environment Variables
2. Set `DATABASE_URL` to the **same value** for:
   - Production
   - Preview  
   - Development

⚠️ **Warning**: This means preview deployments will share data with production.

### Separate Databases (Recommended)

For isolation:

1. Create separate MongoDB databases:
   - `concierge-prod` - Production
   - `concierge-preview` - Preview/Staging
   - `concierge-dev` - Local development

2. Set different `DATABASE_URL` values in Vercel:
   - Production: `mongodb://.../concierge-prod`
   - Preview: `mongodb://.../concierge-preview`

3. Use the setup endpoint to create users in preview

## Quick Setup Script

Create a script to run after preview deployments:

```bash
#!/bin/bash
# setup-preview.sh

PREVIEW_URL=$1

if [ -z "$PREVIEW_URL" ]; then
  echo "Usage: ./setup-preview.sh https://your-preview.vercel.app"
  exit 1
fi

echo "Setting up preview environment: $PREVIEW_URL"

# Check users
echo "Checking existing users..."
curl "$PREVIEW_URL/api/admin/setup-preview-users"

# Create users
echo "Creating missing users..."
curl -X POST "$PREVIEW_URL/api/admin/setup-preview-users"

echo "Setup complete!"
```

## Verification

After setup, verify:

1. **Check user exists:**
   ```bash
   curl https://your-preview-url.vercel.app/api/admin/users/jmagner
   ```

2. **Test login:**
   - Go to preview URL
   - Login with `jmagner` / `jm71Concierge!`
   - Should work!

## Troubleshooting

### User Still Can't Login

1. **Check database connection:**
   ```bash
   curl https://your-preview-url.vercel.app/api/auth/test
   ```

2. **Verify user was created:**
   ```bash
   curl https://your-preview-url.vercel.app/api/admin/users/jmagner
   ```

3. **Check Vercel logs:**
   - Look for authentication errors
   - Check database connection errors

### Database Connection Issues

1. **Verify DATABASE_URL in Vercel:**
   - Go to Project → Settings → Environment Variables
   - Check `DATABASE_URL` is set for Preview environment

2. **Test connection:**
   ```bash
   DATABASE_URL=<preview-db-url> npx tsx scripts/check-user-production.ts
   ```

## Best Practices

1. **Automate Setup**: Add preview user setup to your deployment process
2. **Document Users**: Keep a list of essential users that need to exist
3. **Separate Databases**: Use different databases for preview/production
4. **Regular Checks**: Periodically verify users exist in preview

## Next Steps

1. Call the setup endpoint after each preview deployment
2. Or automate it with a Vercel build hook
3. Document any additional users that need to be created

