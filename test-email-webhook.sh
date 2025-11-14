#!/bin/bash

# Test script for email-to-calendar automation workflow
# This simulates an incoming email from a doctor's office

# Configuration
WEBHOOK_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/email/webhook"
WEBHOOK_SECRET="${EMAIL_WEBHOOK_SECRET:-}"
USER_ID="${USER_ID:-}"  # You'll need to provide your user ID

# Sample doctor's appointment email
EMAIL_FROM="appointments@medicalcenter.com"
EMAIL_SUBJECT="Appointment Confirmation - Dr. Smith"
EMAIL_BODY="Dear Patient,

This is a confirmation of your upcoming appointment:

Date: $(date -v+7d '+%B %d, %Y' 2>/dev/null || date -d '+7 days' '+%B %d, %Y')
Time: 2:00 PM
Doctor: Dr. Sarah Smith
Location: Medical Center, 123 Health Street, Suite 200, San Francisco, CA 94102
Appointment Type: Annual Physical Examination

Please arrive 15 minutes early to complete any necessary paperwork.

If you need to reschedule or cancel, please call us at (555) 123-4567 at least 24 hours in advance.

We look forward to seeing you!

Best regards,
Medical Center Appointment System"

# Check if USER_ID is provided
if [ -z "$USER_ID" ]; then
  echo "❌ Error: USER_ID is required"
  echo ""
  echo "Usage:"
  echo "  USER_ID=your-user-id ./test-email-webhook.sh"
  echo ""
  echo "To get your user ID:"
  echo "  1. Log into the app"
  echo "  2. Open browser console"
  echo "  3. Check session data or use the test-sync endpoint"
  echo ""
  exit 1
fi

# Prepare the request payload
PAYLOAD=$(cat <<EOF
{
  "from": "${EMAIL_FROM}",
  "subject": "${EMAIL_SUBJECT}",
  "body": "${EMAIL_BODY}",
  "userId": "${USER_ID}",
  "to": "patient@example.com"
}
EOF
)

echo "📧 Testing Email-to-Calendar Automation Workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Webhook URL: ${WEBHOOK_URL}"
echo "User ID: ${USER_ID}"
echo ""
echo "Email Details:"
echo "  From: ${EMAIL_FROM}"
echo "  Subject: ${EMAIL_SUBJECT}"
echo "  Date: $(date -v+7d '+%B %d, %Y' 2>/dev/null || date -d '+7 days' '+%B %d, %Y') at 2:00 PM"
echo ""
echo "Sending request..."
echo ""

# Send the request
if [ -n "$WEBHOOK_SECRET" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -H "x-webhook-secret: ${WEBHOOK_SECRET}" \
    -d "${PAYLOAD}")
else
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d "${PAYLOAD}")
fi

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "HTTP Status: ${HTTP_CODE}"
echo ""
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  # Check if appointment was created
  APPOINTMENT_CREATED=$(echo "$BODY" | jq -r '.appointmentCreated // false' 2>/dev/null)
  EVENT_ID=$(echo "$BODY" | jq -r '.eventId // empty' 2>/dev/null)
  
  if [ "$APPOINTMENT_CREATED" = "true" ] && [ -n "$EVENT_ID" ]; then
    echo "✅ SUCCESS! Calendar event created automatically!"
    echo ""
    echo "Event ID: ${EVENT_ID}"
    echo ""
    BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
    echo "View event: ${BASE_URL}/calendar/event/${EVENT_ID}"
    echo "View all events: ${BASE_URL}/calendar"
  else
    echo "⚠️  Email processed, but no appointment was created"
    echo "   (This might be expected if the email format wasn't recognized)"
  fi
else
  echo "❌ Request failed with status ${HTTP_CODE}"
fi

