# Setup Test Users in Preview Environment

## Quick Setup

After your preview deployment is live, call this endpoint once to create test users:

```bash
# Replace with your preview URL
curl -X POST https://your-preview-url.vercel.app/api/admin/setup-test-users \
  -H "Content-Type: application/json"
```

Or visit in browser (if no admin exists yet, it will allow first-time setup):
```
https://your-preview-url.vercel.app/api/admin/setup-test-users
```

## Test User Credentials

After setup, use these credentials:

| User Type | Username | Password | Access |
|-----------|----------|----------|--------|
| Admin | `admin_test` | `AdminTest123!` | Full access |
| Self-Service | `selfservice_test` | `SelfService123!` | Full dashboard |
| Hands-Off | `handsoff_test` | `HandsOff123!` | Messages + Calendar |
| AI-Only | `aionly_test` | `AIOnly123!` | Messages only |
| Agent | `agent_test` | `AgentTest123!` | Workflows |

## Security Note

- The endpoint allows first-time setup if no admin exists
- After an admin is created, it requires admin authentication
- Consider removing this endpoint after initial setup in production

## Alternative: Use Admin Panel

1. Create one admin user manually (signup + update role in DB)
2. Log in as admin
3. Go to `/admin/users/new`
4. Create each test user through the UI

