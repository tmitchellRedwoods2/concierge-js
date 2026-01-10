# How to Setup Test Users in Preview Environment

## Step 1: Wait for Preview Deployment

After pushing to `develop` branch, Vercel will create a preview deployment. Wait for it to complete.

## Step 2: Find Your Preview URL

1. Go to your Vercel dashboard
2. Click on your project
3. Go to the "Deployments" tab
4. Find the latest deployment for the `develop` branch
5. Click on it to see the preview URL (e.g., `concierge-js-xyz123.vercel.app`)

## Step 3: Setup Test Users

Once the preview deployment is live, call the setup endpoint:

### Option A: Using Browser
Simply visit:
```
https://your-preview-url.vercel.app/api/admin/setup-test-users
```

**Note**: Use POST method. If visiting in browser, you may need to use curl or a tool like Postman.

### Option B: Using curl (Recommended)
```bash
curl -X POST https://your-preview-url.vercel.app/api/admin/setup-test-users \
  -H "Content-Type: application/json"
```

### Option C: Using Browser Developer Tools
1. Open your preview URL
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run:
```javascript
fetch('/api/admin/setup-test-users', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## Step 4: Verify Setup

The endpoint will return JSON with:
- `success: true`
- `results`: Count of created/updated users
- `credentials`: List of all test user credentials

## Step 5: Test Login

Use the returned credentials to log in:
- Admin: `admin_test` / `AdminTest123!`
- Self-Service: `selfservice_test` / `SelfService123!`
- Hands-Off: `handsoff_test` / `HandsOff123!`
- AI-Only: `aionly_test` / `AIOnly123!`
- Agent: `agent_test` / `AgentTest123!`

## Troubleshooting

### 404 Error
- **Cause**: Preview deployment not ready or wrong URL
- **Solution**: Check Vercel dashboard for deployment status and correct URL

### 403 Forbidden
- **Cause**: Admin already exists and endpoint requires admin auth
- **Solution**: Log in as admin first, then call the endpoint, OR manually create users via `/admin/users/new`

### 500 Error
- **Cause**: Database connection issue or validation error
- **Solution**: Check Vercel function logs for detailed error message

## Alternative: Manual Setup via Admin Panel

If the API endpoint doesn't work:

1. **Create first admin user**:
   - Sign up at `/signup`
   - Update user in MongoDB: `db.users.updateOne({username: "your_username"}, {$set: {role: "admin"}})`

2. **Log in as admin**

3. **Create test users**:
   - Go to `/admin/users/new`
   - Create each test user with the credentials listed above

