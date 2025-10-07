# MongoDB Atlas Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Verify your email

### Step 2: Create Free Cluster
1. Click **"Build a Database"**
2. Select **"M0 Free"** tier (512 MB storage, free forever)
3. Choose cloud provider: **AWS**
4. Choose region: **Closest to you** (e.g., us-east-1 for East Coast)
5. Cluster name: **concierge-cluster**
6. Click **"Create Deployment"**

### Step 3: Set Up Database User
1. Username: `concierge_admin`
2. Password: **Generate strong password** (click autogenerate)
3. **SAVE THE PASSWORD!** (you'll need it)
4. Click **"Create Database User"**

### Step 4: Set Up Network Access
1. Click **"Add IP Address"**
2. Click **"Allow Access from Anywhere"**
3. IP: `0.0.0.0/0` (for development)
4. Click **"Confirm"**

Note: For production, you'll want to restrict this to specific IPs.

### Step 5: Get Connection String
1. Click **"Connect"**
2. Choose **"Drivers"**
3. Select **"Node.js"** and version **"6.8 or later"**
4. Copy the connection string

It will look like:
```
mongodb+srv://concierge_admin:<password>@concierge-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 6: Update Configuration
1. Replace `<password>` with your actual password
2. Update the connection string in `.env.local`:

```env
DATABASE_URL=mongodb+srv://concierge_admin:YOUR_PASSWORD@concierge-cluster.xxxxx.mongodb.net/concierge?retryWrites=true&w=majority
```

Note: Add `/concierge` before the `?` to specify the database name.

### Step 7: Test Connection
```bash
cd /Users/timmitchell/concierge-js
npm run dev
```

The app will connect to MongoDB Atlas automatically.

## Troubleshooting

### Connection Issues
- Verify password is correct (no special characters need URL encoding)
- Check network access allows 0.0.0.0/0
- Ensure cluster is active (not paused)

### Password with Special Characters
If your password has special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### Cluster Paused
Free tier clusters pause after inactivity. Click "Resume" in the Atlas dashboard.

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Use different credentials for production
- Restrict IP access in production
- Rotate passwords regularly

## Next Steps

Once MongoDB is connected:
1. Run the app: `npm run dev`
2. Check connection logs
3. Proceed with authentication setup

