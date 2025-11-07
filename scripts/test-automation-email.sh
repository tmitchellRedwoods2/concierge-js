#!/bin/bash

# Script to test email sending through automation rules
# This creates a test automation rule and executes it

echo "🧪 Testing Email Through Automation Rules"
echo "=========================================="
echo ""

# Get user ID (you'll need to be logged in)
echo "This script will:"
echo "1. Create a test automation rule with email action"
echo "2. Execute the rule"
echo "3. Verify email is sent"
echo ""
echo "Note: You need to be logged in to the app first"
echo ""

read -p "Enter your recipient email (default: conciergetest831@gmail.com): " recipient_email
recipient_email=${recipient_email:-conciergetest831@gmail.com}

read -p "Enter your user ID (from session): " user_id

if [ -z "$user_id" ]; then
    echo "❌ User ID is required. Please log in to the app and get your user ID from the session."
    exit 1
fi

echo ""
echo "📝 Creating test automation rule..."

# Create the rule via API
RULE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/automation/rules \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  -d "{
    \"name\": \"Test Email Automation Rule\",
    \"description\": \"Test rule to verify email sending through automation\",
    \"trigger\": {
      \"type\": \"webhook\",
      \"conditions\": {}
    },
    \"actions\": [
      {
        \"type\": \"send_email\",
        \"config\": {
          \"to\": \"$recipient_email\",
          \"subject\": \"Test Email from Automation Rule\",
          \"template\": \"appointment_confirmation\",
          \"data\": {
            \"recipientName\": \"Test User\",
            \"title\": \"Test Appointment from Automation\",
            \"startDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
            \"endDate\": \"$(date -u -v+1H +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -u -d '+1 hour' +%Y-%m-%dT%H:%M:%S.000Z)\",
            \"location\": \"Test Location\",
            \"description\": \"This is a test email sent through an automation rule\"
          }
        }
      }
    ],
    \"enabled\": true
  }")

echo "Rule creation response: $RULE_RESPONSE"
echo ""

# Extract rule ID from response (if successful)
RULE_ID=$(echo "$RULE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$RULE_ID" ]; then
    echo "❌ Failed to create rule. Please check the response above."
    echo ""
    echo "Alternative: Create the rule manually through the UI:"
    echo "1. Go to http://localhost:3001/workflows"
    echo "2. Click 'Automation Rules' tab"
    echo "3. Click 'Create Rule'"
    echo "4. Add a 'send_email' action"
    echo "5. Execute the rule"
    exit 1
fi

echo "✅ Rule created with ID: $RULE_ID"
echo ""
echo "🚀 Executing rule..."

# Execute the rule
EXEC_RESPONSE=$(curl -s -X POST http://localhost:3001/api/automation/execute \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  -d "{
    \"ruleId\": \"$RULE_ID\",
    \"triggerData\": {}
  }")

echo "Execution response: $EXEC_RESPONSE"
echo ""

# Check if execution was successful
if echo "$EXEC_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Rule executed successfully!"
    echo ""
    echo "📧 Check your email inbox at: $recipient_email"
    echo "   (Also check spam folder)"
    echo ""
    echo "📊 Execution details:"
    echo "$EXEC_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EXEC_RESPONSE"
else
    echo "❌ Rule execution failed. Check the response above."
fi

echo ""
echo "🧹 To clean up, delete the test rule:"
echo "   curl -X DELETE http://localhost:3001/api/automation/rules/$RULE_ID"

