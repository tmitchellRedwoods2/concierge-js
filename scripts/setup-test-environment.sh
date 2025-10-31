#!/bin/bash

# Concierge.js Test Environment Setup Script
# For Automation Testing and CI/CD Pipelines

set -e

echo "🚀 Setting up Concierge.js Test Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
else
    print_error "Unsupported platform: $OSTYPE"
    exit 1
fi

print_status "Detected platform: $PLATFORM"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if Node.js version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies
print_status "Installing project dependencies..."
npm ci --no-audit --no-fund

# Check if MongoDB is running
print_status "Checking MongoDB status..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        print_success "MongoDB is running"
    else
        print_warning "MongoDB is not running. Starting MongoDB..."
        if [[ "$PLATFORM" == "macos" ]]; then
            brew services start mongodb-community || print_error "Failed to start MongoDB"
        else
            sudo systemctl start mongod || print_error "Failed to start MongoDB"
        fi
    fi
else
    print_warning "MongoDB client not found. Please ensure MongoDB is installed and running."
fi

# Check if MailHog is running
print_status "Checking MailHog status..."
if command -v mailhog &> /dev/null; then
    if curl -s http://localhost:8025/api/v1/messages &> /dev/null; then
        print_success "MailHog is running"
    else
        print_warning "MailHog is not running. Starting MailHog..."
        if [[ "$PLATFORM" == "macos" ]]; then
            brew services start mailhog || print_error "Failed to start MailHog"
        else
            # For Linux, you might need to install MailHog differently
            print_warning "Please install and start MailHog manually for Linux"
        fi
    fi
else
    print_warning "MailHog not found. Installing MailHog..."
    if [[ "$PLATFORM" == "macos" ]]; then
        brew install mailhog
        brew services start mailhog
    else
        print_warning "Please install MailHog manually for Linux"
    fi
fi

# Create test environment file
print_status "Creating test environment configuration..."
cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
TEST_MODE=true

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/concierge-js-test

# Email Testing (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# SMS Testing (Optional - use test credentials)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Test Configuration
LOG_LEVEL=debug
TEST_TIMEOUT=30000
EOF

print_success "Test environment file created: .env.test"

# Create test directories
print_status "Creating test directories..."
mkdir -p tests/{e2e,performance,fixtures,utils}
mkdir -p test-results/{unit,integration,e2e,performance}
mkdir -p docs/{api,testing}

print_success "Test directories created"

# Install test dependencies
print_status "Installing test dependencies..."
npm install --save-dev \
    artillery \
    newman \
    @types/supertest \
    supertest \
    jest-environment-node \
    @types/jest

print_success "Test dependencies installed"

# Create test scripts in package.json
print_status "Adding test scripts to package.json..."
npm pkg set scripts.test:unit="jest --testPathPattern='__tests__'"
npm pkg set scripts.test:integration="jest --testPathPattern='api'"
npm pkg set scripts.test:e2e="jest --testPathPattern='e2e'"
npm pkg set scripts.test:performance="artillery run tests/performance/load-test.yml"
npm pkg set scripts.test:all="npm run test:unit && npm run test:integration && npm run test:e2e"
npm pkg set scripts.test:ci="npm run test:unit -- --coverage --ci --watchAll=false"

print_success "Test scripts added to package.json"

# Create basic test configuration
print_status "Creating Jest configuration..."
cat > jest.config.js << EOF
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageDirectory: 'test-results/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true
};
EOF

print_success "Jest configuration created"

# Create test setup file
print_status "Creating test setup file..."
cat > tests/setup.ts << EOF
// Test setup file
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Use in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test timeout
jest.setTimeout(30000);
EOF

print_success "Test setup file created"

# Create sample E2E test
print_status "Creating sample E2E test..."
cat > tests/e2e/notification-flow.test.ts << EOF
import request from 'supertest';
import { app } from '../../src/app';

describe('Notification Flow E2E Tests', () => {
  test('Complete email notification workflow', async () => {
    const response = await request(app)
      .post('/api/notifications/email')
      .send({
        type: 'appointment_confirmation',
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        title: 'Test Appointment',
        startDate: '2025-11-01T17:00:00.000Z',
        endDate: '2025-11-01T17:30:00.000Z',
        location: 'Test Location'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.messageId).toBeDefined();
  });

  test('Error handling for invalid email', async () => {
    const response = await request(app)
      .post('/api/notifications/email')
      .send({
        type: 'appointment_confirmation',
        recipientEmail: 'invalid-email',
        recipientName: 'Test User',
        title: 'Test Appointment',
        startDate: '2025-11-01T17:00:00.000Z',
        endDate: '2025-11-01T17:30:00.000Z'
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
EOF

print_success "Sample E2E test created"

# Create performance test configuration
print_status "Creating performance test configuration..."
cat > tests/performance/load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

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
            location: "Load Test Location"

  - name: "SMS Notification Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/test-sms"
          json:
            to: "+1234567890"
            body: "Load test SMS message"
EOF

print_success "Performance test configuration created"

# Create Postman collection
print_status "Creating Postman collection..."
cat > tests/postman/Concierge-API-Tests.postman_collection.json << EOF
{
  "info": {
    "name": "Concierge.js Notification API",
    "description": "Complete API testing collection for notification system",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
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
        },
        {
          "name": "Send Calendar Notification",
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
              "raw": "{\n  \"type\": \"appointment_confirmation\",\n  \"recipientEmail\": \"test@example.com\",\n  \"recipientName\": \"Test User\",\n  \"title\": \"Test Appointment\",\n  \"startDate\": \"2025-11-01T17:00:00.000Z\",\n  \"endDate\": \"2025-11-01T17:30:00.000Z\",\n  \"location\": \"Test Location\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/notifications/email",
              "host": ["{{baseUrl}}"],
              "path": ["api", "notifications", "email"]
            }
          }
        }
      ]
    }
  ]
}
EOF

print_success "Postman collection created"

# Create environment file for Postman
cat > tests/postman/Development.postman_environment.json << EOF
{
  "id": "development-env",
  "name": "Development",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "mailhogUrl",
      "value": "http://localhost:8025",
      "enabled": true
    }
  ]
}
EOF

print_success "Postman environment created"

# Run initial tests
print_status "Running initial test suite..."
if npm test -- --passWithNoTests; then
    print_success "Initial tests passed"
else
    print_warning "Some tests failed - this is expected for initial setup"
fi

# Create health check script
print_status "Creating health check script..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Running health checks..."

# Check if development server is running
if curl -s http://localhost:3000/api/test-email > /dev/null; then
    echo "✅ Development server is running"
else
    echo "❌ Development server is not running"
    exit 1
fi

# Check if MailHog is running
if curl -s http://localhost:8025/api/v1/messages > /dev/null; then
    echo "✅ MailHog is running"
else
    echo "❌ MailHog is not running"
    exit 1
fi

# Check if MongoDB is running
if mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is not running"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

chmod +x scripts/health-check.sh
print_success "Health check script created"

# Create cleanup script
print_status "Creating cleanup script..."
cat > scripts/cleanup-test-data.sh << 'EOF'
#!/bin/bash

echo "🧹 Cleaning up test data..."

# Clean up test database
mongosh concierge-js-test --eval "db.dropDatabase()" --quiet

# Clear MailHog messages
curl -X DELETE http://localhost:8025/api/v1/messages

echo "✅ Test data cleaned up"
EOF

chmod +x scripts/cleanup-test-data.sh
print_success "Cleanup script created"

# Final summary
print_success "🎉 Test environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Run health checks: ./scripts/health-check.sh"
echo "3. Run unit tests: npm run test:unit"
echo "4. Run integration tests: npm run test:integration"
echo "5. Run E2E tests: npm run test:e2e"
echo "6. Run performance tests: npm run test:performance"
echo ""
echo "📚 Documentation:"
echo "- API Contracts: docs/API_CONTRACTS.md"
echo "- Testing Guide: docs/AUTOMATION_TESTING_GUIDE.md"
echo "- Test Data: test-fixtures/notification-test-data.json"
echo ""
echo "🔧 Tools installed:"
echo "- Jest (unit/integration testing)"
echo "- Artillery (performance testing)"
echo "- Newman (Postman CLI)"
echo "- Supertest (API testing)"
echo ""
print_success "Happy testing! 🚀"
