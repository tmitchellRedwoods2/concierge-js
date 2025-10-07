# 🚀 CI/CD Pipeline Setup

This document explains the complete CI/CD pipeline setup for Concierge.js.

## 📋 Pipeline Overview

Our CI/CD pipeline includes:

### 🔍 **Code Quality & Linting**
- ESLint for code quality
- Prettier for code formatting
- TypeScript type checking

### 🧪 **Testing**
- Unit tests with Jest
- E2E tests with Playwright
- Coverage reporting
- Mobile testing

### 🏗️ **Build & Deployment**
- Next.js production build
- Vercel deployment
- Build artifact storage

### 🔒 **Security**
- npm audit for vulnerabilities
- Snyk security scanning
- CodeQL analysis
- Trivy vulnerability scanner

### 📊 **Performance**
- Lighthouse CI for performance metrics
- Bundle size analysis
- Performance regression detection

## 🛠️ Required Secrets

Add these secrets to your GitHub repository:

### **Authentication**
```
NEXTAUTH_SECRET=your-nextauth-secret-here
DATABASE_URL=your-mongodb-connection-string
```

### **Deployment**
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### **Security**
```
SNYK_TOKEN=your-snyk-token
```

### **Notifications**
```
SLACK_WEBHOOK=your-slack-webhook-url
EMAIL_USERNAME=your-email@domain.com
EMAIL_PASSWORD=your-app-password
NOTIFICATION_EMAIL=notifications@domain.com
```

### **Performance**
```
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

## 📁 Workflow Files

### **Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
- Runs on every push and PR
- Includes linting, testing, building, security, and deployment
- Triggers performance and mobile testing after deployment

### **Security Scanning** (`.github/workflows/security.yml`)
- Weekly security scans
- Vulnerability detection
- CodeQL analysis

### **Performance Testing** (`.github/workflows/performance.yml`)
- Weekly performance tests
- Lighthouse CI
- Bundle analysis

### **Dependabot Auto-merge** (`.github/workflows/dependabot.yml`)
- Automatically merges dependency updates
- Runs tests before merging

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests Locally**
   ```bash
   npm test
   npm run test:e2e
   ```

3. **Run Linting**
   ```bash
   npm run lint
   npm run format:check
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

## 📊 Monitoring

### **GitHub Actions Dashboard**
- View all workflow runs
- Monitor build status
- Check test results

### **Vercel Dashboard**
- Monitor deployments
- View performance metrics
- Check build logs

### **Security Dashboard**
- View security scan results
- Monitor vulnerability reports
- Track security improvements

## 🔧 Customization

### **Adding New Tests**
1. Add test files to `tests/__tests__/` for unit tests
2. Add E2E tests to `tests/e2e/`
3. Update test scripts in `package.json`

### **Modifying Workflows**
1. Edit workflow files in `.github/workflows/`
2. Add new jobs or steps as needed
3. Update environment variables

### **Adding New Checks**
1. Add new scripts to `package.json`
2. Update workflow files to include new checks
3. Configure appropriate triggers

## 📈 Performance Metrics

The pipeline tracks:
- **Build Time**: How long builds take
- **Test Coverage**: Percentage of code covered
- **Performance Scores**: Lighthouse metrics
- **Security Score**: Vulnerability count
- **Bundle Size**: JavaScript bundle size

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

2. **Test Failures**
   - Run tests locally first
   - Check test configuration
   - Verify test data setup

3. **Deployment Issues**
   - Check Vercel configuration
   - Verify deployment secrets
   - Check build logs

### **Getting Help**
- Check GitHub Actions logs
- Review Vercel deployment logs
- Check security scan results
- Monitor performance metrics

## 🎯 Best Practices

1. **Keep Dependencies Updated**
   - Use Dependabot for automatic updates
   - Review security advisories
   - Test updates before merging

2. **Monitor Performance**
   - Check Lighthouse scores
   - Monitor bundle size
   - Track performance regressions

3. **Security First**
   - Regular security scans
   - Keep dependencies updated
   - Monitor vulnerability reports

4. **Quality Gates**
   - All tests must pass
   - Code coverage thresholds
   - Performance benchmarks
   - Security requirements

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Playwright Testing](https://playwright.dev/)
- [Jest Testing](https://jestjs.io/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
