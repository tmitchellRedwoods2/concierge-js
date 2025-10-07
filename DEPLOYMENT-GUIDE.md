# 🚀 Deployment Guide

## 📋 Quick Setup Checklist

### ✅ **1. GitHub Secrets Configuration**

Go to: https://github.com/tmitchellRedwoods2/concierge-js/settings/secrets/actions

**Required Secrets:**
```
NEXTAUTH_SECRET=SMy29bysiOxKPSv6XsUr46zcvzt15vmBMDYOWdIqlN0=
DATABASE_URL=mongodb://localhost:27017/concierge
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### ✅ **2. Vercel Setup**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Get Vercel Credentials:**
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token
   - Copy the token to GitHub secrets as `VERCEL_TOKEN`
   - Get your Org ID and Project ID from Vercel dashboard

### ✅ **3. MongoDB Setup**

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
brew install mongodb-community
brew services start mongodb-community

# Use local connection
DATABASE_URL=mongodb://localhost:27017/concierge
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Go to https://cloud.mongodb.com/
2. Create a free cluster
3. Get connection string
4. Use as `DATABASE_URL` in secrets

### ✅ **4. Environment Variables**

Create `.env.local` file:
```bash
NEXTAUTH_SECRET=SMy29bysiOxKPSv6XsUr46zcvzt15vmBMDYOWdIqlN0=
DATABASE_URL=mongodb://localhost:27017/concierge
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 **Step-by-Step Setup**

### **Step 1: Configure GitHub Secrets**

1. Go to your repository: https://github.com/tmitchellRedwoods2/concierge-js
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NEXTAUTH_SECRET` | `SMy29bysiOxKPSv6XsUr46zcvzt15vmBMDYOWdIqlN0=` | NextAuth secret key |
| `DATABASE_URL` | `mongodb://localhost:27017/concierge` | MongoDB connection string |
| `VERCEL_TOKEN` | `your-vercel-token` | Vercel API token |
| `VERCEL_ORG_ID` | `your-org-id` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | `your-project-id` | Vercel project ID |

### **Step 2: Set up Vercel**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy your project:**
   ```bash
   cd /Users/timmitchell/concierge-js
   vercel
   ```

4. **Get Vercel credentials:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click on your project
   - Go to Settings → General
   - Copy **Project ID** and **Team ID** (Org ID)

### **Step 3: Set up MongoDB**

**For Development (Local):**
```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.runCommand('ping')"
```

**For Production (MongoDB Atlas):**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Add to GitHub secrets

### **Step 4: Test the Pipeline**

1. **Make a small change** to trigger the pipeline:
   ```bash
   echo "# Test commit" >> README.md
   git add README.md
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

2. **Check GitHub Actions:**
   - Go to Actions tab in your repository
   - Watch the pipeline run
   - Check for any failures

3. **Check Vercel Deployment:**
   - Go to Vercel dashboard
   - Check deployment status
   - Test the live URL

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Build Failures:**
   - Check TypeScript errors
   - Verify all dependencies
   - Check environment variables

2. **Deployment Issues:**
   - Verify Vercel credentials
   - Check build logs
   - Ensure secrets are set

3. **Database Connection:**
   - Verify MongoDB is running
   - Check connection string
   - Test database access

### **Getting Help:**

1. **Check GitHub Actions Logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Check logs for errors

2. **Check Vercel Logs:**
   - Go to Vercel dashboard
   - Click on deployment
   - Check function logs

3. **Local Testing:**
   ```bash
   npm run dev
   npm run build
   npm test
   ```

## 📊 **Monitoring**

### **GitHub Actions Dashboard:**
- View all workflow runs
- Monitor build status
- Check test results

### **Vercel Dashboard:**
- Monitor deployments
- View performance metrics
- Check function logs

### **MongoDB Atlas:**
- Monitor database performance
- Check connection metrics
- View query analytics

## 🎯 **Next Steps**

1. **Set up monitoring** with Vercel Analytics
2. **Configure custom domain** in Vercel
3. **Set up staging environment**
4. **Add more tests** as you develop
5. **Monitor performance** with Lighthouse CI

## 📚 **Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [NextAuth.js](https://next-auth.js.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
