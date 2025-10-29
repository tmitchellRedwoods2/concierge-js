# CI/CD Pipeline Examples

## Overview
This document provides comprehensive CI/CD pipeline examples for the Concierge.js notification system, designed for various platforms and deployment strategies.

## GitHub Actions

### Complete Workflow
```yaml
# .github/workflows/notification-system-ci.yml
name: Notification System CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

env:
  NODE_VERSION: '18'
  MONGODB_VERSION: '6.0'
  MAILHOG_VERSION: 'latest'

jobs:
  # Code Quality Checks
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Run Prettier check
        run: npm run format:check

  # Unit and Integration Tests
  test:
    runs-on: ubuntu-latest
    needs: quality
    
    services:
      mongodb:
        image: mongo:${{ env.MONGODB_VERSION }}
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand(\"ping\").ok' --quiet"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      mailhog:
        image: mailhog/mailhog:${{ env.MAILHOG_VERSION }}
        ports:
          - 1025:1025
          - 8025:8025

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/concierge-js-test
          SMTP_HOST: localhost
          SMTP_PORT: 1025

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/concierge-js-test
          SMTP_HOST: localhost
          SMTP_PORT: 1025

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/

      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-reports
          path: test-results/coverage/

  # End-to-End Tests
  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    services:
      mongodb:
        image: mongo:${{ env.MONGODB_VERSION }}
        ports:
          - 27017:27017

      mailhog:
        image: mailhog/mailhog:${{ env.MAILHOG_VERSION }}
        ports:
          - 1025:1025
          - 8025:8025

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: |
          npm run build
          npm start &
          sleep 30
        env:
          NODE_ENV: production
          MONGODB_URI: mongodb://localhost:27017/concierge-js-test
          SMTP_HOST: localhost
          SMTP_PORT: 1025

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          MAILHOG_URL: http://localhost:8025

      - name: Upload E2E results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results
          path: test-results/e2e/

  # Performance Tests
  performance:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    
    services:
      mongodb:
        image: mongo:${{ env.MONGODB_VERSION }}
        ports:
          - 27017:27017

      mailhog:
        image: mailhog/mailhog:${{ env.MAILHOG_VERSION }}
        ports:
          - 1025:1025
          - 8025:8025

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: |
          npm run build
          npm start &
          sleep 30
        env:
          NODE_ENV: production
          MONGODB_URI: mongodb://localhost:27017/concierge-js-test
          SMTP_HOST: localhost
          SMTP_PORT: 1025

      - name: Run performance tests
        run: npm run test:performance
        env:
          BASE_URL: http://localhost:3000

      - name: Upload performance results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-results
          path: test-results/performance/

  # Security Scanning
  security:
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Build and Deploy
  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          vercel-args: '--prod'

      - name: Run smoke tests
        run: |
          sleep 30
          npm run test:smoke
        env:
          BASE_URL: ${{ steps.deploy.outputs.preview-url }}

  # Notification Tests
  notification-tests:
    runs-on: ubuntu-latest
    needs: deploy
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Test email notifications
        run: |
          curl -X POST "${{ steps.deploy.outputs.preview-url }}/api/test-email" \
            -H "Content-Type: application/json" \
            -d '{"to":"test@example.com","subject":"CI Test","text":"Test from CI"}'

      - name: Test SMS notifications
        run: |
          curl -X POST "${{ steps.deploy.outputs.preview-url }}/api/test-sms" \
            -H "Content-Type: application/json" \
            -d '{"to":"+1234567890","body":"CI Test SMS"}'
        env:
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
```

## Jenkins Pipeline

### Complete Jenkinsfile
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        MONGODB_URI = 'mongodb://localhost:27017/concierge-js-test'
        SMTP_HOST = 'localhost'
        SMTP_PORT = '1025'
        NODE_ENV = 'test'
    }
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npm run type-check'
                    }
                }
                stage('Format Check') {
                    steps {
                        sh 'npm run format:check'
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/unit/*.xml'
                    publishCoverage adapters: [
                        jacocoAdapter('test-results/coverage/lcov.info')
                    ]
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/integration/*.xml'
                }
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh '''
                    npm run build
                    npm start &
                    sleep 30
                    npm run test:e2e
                '''
            }
            post {
                always {
                    sh 'pkill -f "npm start" || true'
                    publishTestResults testResultsPattern: 'test-results/e2e/*.xml'
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    npm run build
                    npm start &
                    sleep 30
                    npm run test:performance
                '''
            }
            post {
                always {
                    sh 'pkill -f "npm start" || true'
                    archiveArtifacts artifacts: 'test-results/performance/**', fingerprint: true
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'npm audit --audit-level moderate'
                sh 'npm run security:scan'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: '.next/**', fingerprint: true
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh 'npm run deploy:staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run deploy:production'
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                sh 'npm run test:smoke'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            emailext (
                subject: "Build Successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build ${env.BUILD_NUMBER} was successful!",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build ${env.BUILD_NUMBER} failed. Please check the logs.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## GitLab CI/CD

### Complete .gitlab-ci.yml
```yaml
# .gitlab-ci.yml
stages:
  - quality
  - test
  - e2e
  - performance
  - security
  - build
  - deploy
  - smoke

variables:
  NODE_VERSION: "18"
  MONGODB_URI: "mongodb://localhost:27017/concierge-js-test"
  SMTP_HOST: "localhost"
  SMTP_PORT: "1025"

# Code Quality
code_quality:
  stage: quality
  image: node:18
  script:
    - npm ci
    - npm run lint
    - npm run type-check
    - npm run format:check
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Unit Tests
unit_tests:
  stage: test
  image: node:18
  services:
    - mongo:6.0
    - mailhog/mailhog:latest
  script:
    - npm ci
    - npm run test:unit
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: test-results/unit/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: test-results/coverage/cobertura-coverage.xml
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Integration Tests
integration_tests:
  stage: test
  image: node:18
  services:
    - mongo:6.0
    - mailhog/mailhog:latest
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    reports:
      junit: test-results/integration/junit.xml
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# E2E Tests
e2e_tests:
  stage: e2e
  image: node:18
  services:
    - mongo:6.0
    - mailhog/mailhog:latest
  script:
    - npm ci
    - npm run build
    - npm start &
    - sleep 30
    - npm run test:e2e
  artifacts:
    reports:
      junit: test-results/e2e/junit.xml
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Performance Tests
performance_tests:
  stage: performance
  image: node:18
  services:
    - mongo:6.0
    - mailhog/mailhog:latest
  script:
    - npm ci
    - npm run build
    - npm start &
    - sleep 30
    - npm run test:performance
  artifacts:
    paths:
      - test-results/performance/
  only:
    - develop
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Security Scan
security_scan:
  stage: security
  image: node:18
  script:
    - npm ci
    - npm audit --audit-level moderate
    - npm run security:scan
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Build
build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Deploy to Staging
deploy_staging:
  stage: deploy
  image: node:18
  script:
    - npm run deploy:staging
  environment:
    name: staging
    url: https://concierge-js-staging.vercel.app
  only:
    - develop
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Deploy to Production
deploy_production:
  stage: deploy
  image: node:18
  script:
    - npm run deploy:production
  environment:
    name: production
    url: https://concierge-js.vercel.app
  only:
    - main
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}

# Smoke Tests
smoke_tests:
  stage: smoke
  image: node:18
  script:
    - npm ci
    - npm run test:smoke
  environment:
    name: $CI_ENVIRONMENT_NAME
    url: $CI_ENVIRONMENT_URL
  only:
    - develop
    - main
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}
```

## Azure DevOps

### Complete azure-pipelines.yml
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - develop
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18'
  mongodbVersion: '6.0'
  mailhogVersion: 'latest'

stages:
- stage: Quality
  displayName: 'Code Quality'
  jobs:
  - job: QualityChecks
    displayName: 'Quality Checks'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    - script: |
        npm ci
        npm run lint
        npm run type-check
        npm run format:check
      displayName: 'Run Quality Checks'

- stage: Test
  displayName: 'Testing'
  dependsOn: Quality
  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'
    services:
      mongo:
        image: mongo:$(mongodbVersion)
        ports:
          - 27017:27017
      mailhog:
        image: mailhog/mailhog:$(mailhogVersion)
        ports:
          - 1025:1025
          - 8025:8025
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    - script: |
        npm ci
        npm run test:unit
      displayName: 'Run Unit Tests'
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://localhost:27017/concierge-js-test
        SMTP_HOST: localhost
        SMTP_PORT: 1025
    - task: PublishTestResults@2
      inputs:
        testResultsFiles: 'test-results/unit/*.xml'
        testRunTitle: 'Unit Tests'
      condition: always()
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: 'test-results/coverage/cobertura-coverage.xml'
      condition: always()

  - job: IntegrationTests
    displayName: 'Integration Tests'
    services:
      mongo:
        image: mongo:$(mongodbVersion)
        ports:
          - 27017:27017
      mailhog:
        image: mailhog/mailhog:$(mailhogVersion)
        ports:
          - 1025:1025
          - 8025:8025
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    - script: |
        npm ci
        npm run test:integration
      displayName: 'Run Integration Tests'
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://localhost:27017/concierge-js-test
        SMTP_HOST: localhost
        SMTP_PORT: 1025
    - task: PublishTestResults@2
      inputs:
        testResultsFiles: 'test-results/integration/*.xml'
        testRunTitle: 'Integration Tests'
      condition: always()

- stage: E2E
  displayName: 'End-to-End Tests'
  dependsOn: Test
  jobs:
  - job: E2ETests
    displayName: 'E2E Tests'
    services:
      mongo:
        image: mongo:$(mongodbVersion)
        ports:
          - 27017:27017
      mailhog:
        image: mailhog/mailhog:$(mailhogVersion)
        ports:
          - 1025:1025
          - 8025:8025
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    - script: |
        npm ci
        npm run build
        npm start &
        sleep 30
        npm run test:e2e
      displayName: 'Run E2E Tests'
      env:
        NODE_ENV: production
        MONGODB_URI: mongodb://localhost:27017/concierge-js-test
        SMTP_HOST: localhost
        SMTP_PORT: 1025
    - task: PublishTestResults@2
      inputs:
        testResultsFiles: 'test-results/e2e/*.xml'
        testRunTitle: 'E2E Tests'
      condition: always()

- stage: Deploy
  displayName: 'Deploy'
  dependsOn: E2E
  jobs:
  - deployment: DeployStaging
    displayName: 'Deploy to Staging'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    environment: 'staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
          - script: |
              npm ci
              npm run deploy:staging
            displayName: 'Deploy to Staging'

  - deployment: DeployProduction
    displayName: 'Deploy to Production'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
          - script: |
              npm ci
              npm run deploy:production
            displayName: 'Deploy to Production'
```

## Docker-based Testing

### Docker Compose for Testing
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - MONGODB_URI=mongodb://mongo:27017/concierge-js-test
      - SMTP_HOST=mailhog
      - SMTP_PORT=1025
    depends_on:
      - mongo
      - mailhog
    command: npm run test:all

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=concierge-js-test

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Dockerfile for Testing
```dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Install test dependencies
RUN npm ci

# Create test user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run tests
CMD ["npm", "run", "test:all"]
```

## Monitoring and Alerting

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'concierge-js'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'mailhog'
    static_configs:
      - targets: ['localhost:8025']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Concierge.js Notification System",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Email Notifications Sent",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(email_notifications_sent_total[5m])"
          }
        ]
      },
      {
        "title": "SMS Notifications Sent",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(sms_notifications_sent_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

### 1. Environment Management
- Use environment-specific configurations
- Store secrets in secure vaults
- Use feature flags for gradual rollouts

### 2. Testing Strategy
- Run fast tests first (unit tests)
- Use parallel execution for independent tests
- Implement proper test data management

### 3. Deployment Strategy
- Use blue-green deployments for zero downtime
- Implement proper rollback mechanisms
- Monitor deployment health

### 4. Security
- Scan dependencies for vulnerabilities
- Use least privilege access
- Encrypt sensitive data

### 5. Monitoring
- Set up comprehensive logging
- Implement health checks
- Use proper alerting thresholds
