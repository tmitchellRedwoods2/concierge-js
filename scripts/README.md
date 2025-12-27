# Test User Setup Script

## Overview

The `setup-test-users.ts` script creates test users with different roles and access modes for automated Selenium testing of the RBAC system.

## Usage

```bash
npm run setup-test-users
```

Or directly with tsx:

```bash
npx tsx scripts/setup-test-users.ts
```

## Test Users Created

The script creates the following test users:

### Admin User
- **Username**: `admin_test`
- **Email**: `admin@test.com`
- **Password**: `AdminTest123!`
- **Role**: `admin`
- **Access**: Full access to all pages

### Self-Service Client
- **Username**: `selfservice_test`
- **Email**: `selfservice@test.com`
- **Password**: `SelfService123!`
- **Role**: `client`
- **Access Mode**: `self-service`
- **Access**: Full dashboard and all service pages

### Hands-Off Client
- **Username**: `handsoff_test`
- **Email**: `handsoff@test.com`
- **Password**: `HandsOff123!`
- **Role**: `client`
- **Access Mode**: `hands-off`
- **Access**: Minimal dashboard, messages, and calendar only

### AI-Only Client
- **Username**: `aionly_test`
- **Email**: `aionly@test.com`
- **Password**: `AIOnly123!`
- **Role**: `client`
- **Access Mode**: `ai-only`
- **Access**: Messages only

### Agent User
- **Username**: `agent_test`
- **Email**: `agent@test.com`
- **Password**: `AgentTest123!`
- **Role**: `agent`
- **Access**: Workflow management and service editing

## Behavior

- **If user exists**: Updates the user with new credentials and role/access mode
- **If user doesn't exist**: Creates a new user with the specified credentials
- **Password**: Always updated to ensure consistency

## Prerequisites

1. MongoDB connection configured in environment variables
2. Database accessible from the script execution environment
3. `tsx` package installed (already in devDependencies)

## Output

The script prints:
- Status of each user (created/updated)
- Summary of operations
- Complete list of credentials for Selenium tests

## Use in Selenium Tests

These credentials can be used directly in your Selenium test scripts:

```python
# Example Selenium test
def test_self_service_dashboard(self, driver):
    driver.get(app_url)
    # Login as self-service client
    driver.find_element(By.ID, "username").send_keys("selfservice_test")
    driver.find_element(By.ID, "password").send_keys("SelfService123!")
    driver.find_element(By.ID, "login-button").click()
    # Verify dashboard loads
    assert "Welcome back" in driver.page_source
```

## Notes

- Passwords are hashed using bcrypt before storage
- Users are created in the same database as your application
- Run this script before executing Selenium tests
- The script is idempotent - safe to run multiple times

