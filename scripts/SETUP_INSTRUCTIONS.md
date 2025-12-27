# Test User Setup Instructions

## Issue: Users Created Locally But Not Working in Production

If you created test users locally but they're not working when you try to log in, it's likely because:

1. **Local database vs Production database**: The script creates users in your local MongoDB, but Vercel/production uses a different database connection.

## Solution: Create Users in Production Database

### Option 1: Run Script on Vercel (Recommended)

You can run the setup script directly on your Vercel deployment:

1. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI if you haven't
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link to your project
   vercel link
   
   # Run the script with production environment
   vercel env pull .env.production
   NODE_ENV=production npm run setup-test-users
   ```

2. **Via Vercel Functions** (Temporary):
   - Create a temporary API route that runs the setup script
   - Call it once to create users
   - Delete the route after

### Option 2: Use Admin Panel (After First Admin Login)

1. Log in with an existing admin user (or create one manually)
2. Navigate to `/admin/users/new`
3. Create each test user manually through the UI

### Option 3: MongoDB Shell/Compass

Connect directly to your production MongoDB and run:

```javascript
// In MongoDB shell or Compass
use your_database_name;

// Create admin user
db.users.insertOne({
  username: "admin_test",
  email: "admin@test.com",
  password: "$2a$10$...", // Use bcrypt hash from local script
  firstName: "Admin",
  lastName: "Test",
  role: "admin",
  plan: "elite",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Quick Fix: Create One Admin User Manually

If you need to get started quickly:

1. **Sign up a new user** through the `/signup` page
2. **Manually update the user in MongoDB** to set `role: 'admin'`:
   ```javascript
   db.users.updateOne(
     { username: "your_username" },
     { $set: { role: "admin" } }
   );
   ```
3. **Use that admin account** to create other test users via `/admin/users/new`

## Verify Users Are Working

After creating users, test login:

1. Go to `/login`
2. Try logging in with:
   - Username: `admin_test`
   - Password: `AdminTest123!`

If it still doesn't work, check:
- Browser console for errors
- Vercel function logs for authentication errors
- Database connection string matches between script and app

## Environment Variables

Make sure these are set in Vercel:
- `MONGODB_URI` - Your production MongoDB connection string
- `NEXTAUTH_SECRET` - Your NextAuth secret
- `NEXTAUTH_URL` - Your production URL

## Debugging

The auth system now logs detailed information. Check Vercel function logs to see:
- If user is found
- If password matches
- Any errors during authentication

Look for log messages starting with:
- `🔍 Auth: Looking up user`
- `✅ Auth: User found`
- `❌ Auth: User not found`
- `❌ Auth: Password mismatch`

