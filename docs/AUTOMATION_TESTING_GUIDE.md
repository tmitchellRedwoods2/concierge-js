# Automation Testing Guide

## Overview
This guide provides comprehensive instructions for automated testing of the Concierge.js notification system, designed for CI/CD pipelines and automated testing frameworks.

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- MailHog running for email testing
- Twilio account for SMS testing (optional)

## Test Environment Setup

### 1. Local Development Environment
```bash
# Start MailHog
brew services start mailhog

# Start MongoDB (if local)
brew services start mongodb-community

# Install dependencies
npm ci

# Start development server
npm run dev
```

### 2. Environment Variables
Create `.env.test` for automated testing:
```bash
# Email Testing (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# SMS Testing (Optional)
TWILIO_ACCOUNT_SID=your_test_account_sid
TWILIO_AUTH_TOKEN=your_test_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Database
MONGODB_URI=mongodb://localhost:27017/concierge-js-test

# Test Configuration
NODE_ENV=test
TEST_MODE=true
```

## Test Categories

### 1. Unit Tests
**Location**: `src/__tests__/`
**Command**: `npm test`
**Coverage**: Service classes, utility functions, data models

**Key Test Files**:
- `services/email-notification.test.ts`
- `services/notification-service.test.ts`
- `services/sms-notification.test.ts`

### 2. Integration Tests
**Location**: `src/__tests__/api/`
**Command**: `npm test -- --testPathPattern="api"`
**Coverage**: API endpoints, database interactions, external service integration

**Key Test Files**:
- `api/notifications/email.test.ts`
- `api/test-email.test.ts`
- `api/test-sms.test.ts`

### 3. End-to-End Tests
**Location**: `tests/e2e/` (to be created)
**Command**: `npm run test:e2e`
**Coverage**: Complete user workflows, cross-service integration

### 4. Performance Tests
**Location**: `tests/performance/` (to be created)
**Command**: `npm run test:performance`
**Coverage**: Load testing, stress testing, response times

## API Testing Framework Examples

### Postman Collection
```json
{
  "info": {
    "name": "Concierge.js Notification API",
    "description": "Complete API testing collection"
  },
  "item": [
    {
      "name": "Email Notifications",
      "item": [
        {
          "name": "Send Test Email",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"to\": \"test@example.com\",\n  \"subject\": \"Test Email\",\n  \"text\": \"Test email body\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/test-email",
              "host": ["{{baseUrl}}"],
              "path": ["api", "test-email"]
            }
          }
        }
      ]
    }
  ]
}
```

### Newman (Postman CLI) Testing
```bash
# Install Newman
npm install -g newman

# Run collection
newman run tests/postman/Concierge-API-Tests.postman_collection.json \
  --environment tests/postman/Development.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Jest + Supertest Integration Tests
```javascript
// tests/integration/notification-flow.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Notification Flow Integration', () => {
  test('Complete email notification workflow', async () => {
    const response = await request(app)
      .post('/api/notifications/email')
      .send({
        type: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        title: 'Test Appointment',
        startDate: '2025-11-01T17:00:00.000Z',
        endDate: '2025-11-01T17:30:00.000Z'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.messageId).toBeDefined();
  });
});
```

## Load Testing with Artillery

### Artillery Configuration
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Email Notification Load Test"
    weight: 70
    flow:
      - post:
          url: "/api/notifications/email"
          json:
            type: "appointment_confirmation"
            recipientEmail: "loadtest@example.com"
            recipientName: "Load Test User"
            title: "Load Test Appointment"
            startDate: "2025-11-01T17:00:00.000Z"
            endDate: "2025-11-01T17:30:00.000Z"
  - name: "SMS Notification Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/test-sms"
          json:
            to: "+1234567890"
            body: "Load test SMS message"
```

### Run Load Tests
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/performance/load-test.yml

# Generate report
artillery run tests/performance/load-test.yml --output results.json
artillery report results.json
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test-notifications.yml
name: Notification System Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
      
      mailhog:
        image: mailhog/mailhog:latest
        ports:
          - 1025:1025
          - 8025:8025

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/concierge-js-test
          SMTP_HOST: localhost
          SMTP_PORT: 1025
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        MONGODB_URI = 'mongodb://localhost:27017/concierge-js-test'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'brew services start mailhog'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/*.xml'
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
        }
        
        stage('Performance Tests') {
            steps {
                sh 'npm run test:performance'
            }
        }
        
        stage('Security Tests') {
            steps {
                sh 'npm audit'
                sh 'npm run test:security'
            }
        }
    }
    
    post {
        always {
            sh 'brew services stop mailhog'
            archiveArtifacts artifacts: 'test-results/**', fingerprint: true
        }
    }
}
```

## Monitoring and Alerting

### Test Metrics to Monitor
- **Response Time**: < 200ms for API calls
- **Success Rate**: > 99% for notification delivery
- **Error Rate**: < 1% for all endpoints
- **Email Delivery**: 100% success rate in MailHog
- **SMS Delivery**: > 95% success rate (Twilio dependent)

### Alerting Rules
```yaml
# monitoring/alerts.yml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
  
  - name: "Slow Response Time"
    condition: "avg_response_time > 500ms"
    duration: "10m"
    severity: "warning"
  
  - name: "Email Delivery Failure"
    condition: "email_delivery_rate < 95%"
    duration: "2m"
    severity: "critical"
```

## Test Data Management

### Test Data Cleanup
```javascript
// tests/utils/test-data-cleanup.js
const { MongoClient } = require('mongodb');

async function cleanupTestData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('concierge-js-test');
  
  // Clean up test collections
  await db.collection('calendarevents').deleteMany({
    title: { $regex: /^Test|^Load Test/ }
  });
  
  await db.collection('workflowexecutions').deleteMany({
    workflowId: { $regex: /^test-/ }
  });
  
  await client.close();
}

module.exports = { cleanupTestData };
```

### Database Seeding
```javascript
// tests/utils/seed-test-data.js
const testData = require('../fixtures/notification-test-data.json');

async function seedTestData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('concierge-js-test');
  
  // Insert test users
  await db.collection('users').insertMany(testData.testUsers);
  
  // Insert test appointments
  await db.collection('calendarevents').insertMany(testData.testAppointments);
  
  await client.close();
}
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use unique identifiers for test data

### 2. Environment Management
- Use separate test databases
- Mock external services when possible
- Use environment-specific configurations

### 3. Error Handling
- Test both success and failure scenarios
- Validate error response formats
- Test timeout and retry mechanisms

### 4. Performance Considerations
- Run performance tests regularly
- Monitor memory usage during tests
- Test with realistic data volumes

### 5. Security Testing
- Test authentication and authorization
- Validate input sanitization
- Test for common vulnerabilities (OWASP Top 10)

## Troubleshooting

### Common Issues
1. **MailHog Connection Failed**: Ensure MailHog is running on port 8025
2. **MongoDB Connection Error**: Check MongoDB service status
3. **Authentication Failures**: Verify session cookies and auth configuration
4. **Test Timeouts**: Increase timeout values for slow operations

### Debug Commands
```bash
# Check MailHog status
curl http://localhost:8025/api/v1/messages

# Check MongoDB connection
mongosh mongodb://localhost:27017/concierge-js-test

# Check application logs
npm run dev 2>&1 | grep -E "(ERROR|WARN)"

# Run tests with verbose output
npm test -- --verbose --detectOpenHandles
```
