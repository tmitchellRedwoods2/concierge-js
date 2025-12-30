# Troubleshooting Login Issues - jmagner User

## Problem
User `jmagner` cannot log in, even though it worked before.

## Diagnostic Steps

### 1. Check Database Connection (Vercel Deployment)

Visit your Vercel deployment and go to:
```
https://your-app.vercel.app/api/auth/test
```

This will show:
- Database connection status
- Total user count
- Whether `jmagner` user exists
- Environment variables status

### 2. Check if User Exists (API Endpoint)

Visit:
```
https://your-app.vercel.app/api/admin/users/jmagner
```

This will return:
- `exists: true/false` - Whether the user exists
- User details if found
- Suggestion if user needs to be created

### 3. Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" → Latest deployment → "Functions" tab
4. Look for logs containing:
   - `🔍 Auth: Looking up user: "jmagner"`
   - `✅ Auth: User found` or `❌ Auth: User not found`
   - `✅ Auth: Password valid` or `❌ Auth: Password mismatch`

### 4. Verify Environment Variables in Vercel

Ensure these are set in Vercel:
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `NEXTAUTH_URL` - Your app URL (auto-set by Vercel, but verify)

## Solutions

### Solution 1: User Doesn't Exist in Production Database

If the user doesn't exist, create it using the API endpoint:

**Option A: Using API (Requires Admin Login)**
```bash
curl -X POST https://your-app.vercel.app/api/admin/users/jmagner \
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

**Option B: Using Script (Local Development)**
```bash
npx tsx scripts/create-user-jmagner.ts
```

**Option C: Using Script with Production Database**
```bash
DATABASE_URL=<your-production-db-url> npx tsx scripts/create-user-jmagner.ts
```

### Solution 2: User Exists but Password is Wrong

If the user exists but password doesn't match, update it:

```bash
curl -X POST https://your-app.vercel.app/api/admin/users/jmagner \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-admin-session>" \
  -d '{
    "password": "jm71Concierge!"
  }'
```

### Solution 3: Database Connection Issue

If database connection is failing:

1. **Check DATABASE_URL in Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `DATABASE_URL` is set correctly
   - Ensure it's set for the correct environment (Production/Preview)

2. **Test Connection:**
   ```bash
   DATABASE_URL=<your-db-url> npx tsx scripts/check-user-production.ts
   ```

3. **Check MongoDB Atlas (if using):**
   - Verify IP whitelist includes Vercel IPs (0.0.0.0/0 for all)
   - Verify database user has correct permissions
   - Check if database is paused (free tier)

### Solution 4: NEXTAUTH_SECRET Issue

If authentication is failing due to secret:

1. **Generate a new secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Set in Vercel:**
   - Go to Environment Variables
   - Update `NEXTAUTH_SECRET` with the new value
   - Redeploy the application

## Verification

After applying a solution, verify:

1. **Check user exists:**
   ```
   GET https://your-app.vercel.app/api/admin/users/jmagner
   ```

2. **Test login:**
   - Go to `/login` page
   - Enter username: `jmagner`
   - Enter password: `jm71Concierge!`
   - Should redirect to dashboard

3. **Check logs:**
   - Look for successful authentication in Vercel logs
   - Should see: `✅ Auth: Password valid for user: jmagner`

## Scripts Available

### `scripts/verify-user.ts`
Check if user exists locally and verify password:
```bash
npx tsx scripts/verify-user.ts
```

### `scripts/check-user-production.ts`
Check user in production database:
```bash
DATABASE_URL=<prod-url> npx tsx scripts/check-user-production.ts
```

### `scripts/create-user-jmagner.ts`
Create the jmagner user locally:
```bash
npx tsx scripts/create-user-jmagner.ts
```

## Common Issues

### Issue: "User not found"
**Cause:** User doesn't exist in the database being used
**Solution:** Create the user using one of the methods above

### Issue: "Password mismatch"
**Cause:** Password hash doesn't match
**Solution:** Update password using the API endpoint

### Issue: "Database connection failed"
**Cause:** DATABASE_URL incorrect or database unreachable
**Solution:** Verify DATABASE_URL and database accessibility

### Issue: "Authentication failed"
**Cause:** NEXTAUTH_SECRET mismatch or session issue
**Solution:** Verify NEXTAUTH_SECRET and clear browser cookies

## Next Steps

1. Run diagnostic: `/api/auth/test`
2. Check user: `/api/admin/users/jmagner`
3. Review Vercel logs for specific error
4. Apply appropriate solution based on findings
5. Verify login works

