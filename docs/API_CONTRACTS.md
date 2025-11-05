# API Contracts Documentation

## Overview
This document defines the API contracts for the Concierge.js notification system, designed for automated testing and integration.

## Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://your-vercel-app.vercel.app`

## Authentication
All API endpoints require authentication via NextAuth.js session cookies.

## Email Notification APIs

### 1. Test Email Endpoint
**POST** `/api/test-email`

Send a test email notification.

#### Request Body
```json
{
  "to": "test@example.com",
  "subject": "Test Email Subject",
  "text": "Test email body content",
  "html": "<p>Test email HTML content</p>"
}
```

#### Response (Success)
```json
{
  "success": true,
  "messageId": "test-message-id-123",
  "message": "Test email sent successfully"
}
```

#### Response (Error)
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

### 2. Email Notifications API
**POST** `/api/notifications/email`

Send calendar event notifications.

#### Request Body
```json
{
  "type": "appointment_confirmation",
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "title": "Doctor Appointment",
  "startDate": "2025-11-01T17:00:00.000Z",
  "endDate": "2025-11-01T17:30:00.000Z",
  "location": "123 Main St, City, State",
  "description": "Annual checkup with Dr. Smith"
}
```

#### Notification Types
- `appointment_confirmation` - New appointment created
- `appointment_reminder` - Upcoming appointment reminder
- `appointment_cancelled` - Appointment cancelled
- `appointment_modified` - Appointment details changed

#### Response (Success)
```json
{
  "success": true,
  "messageId": "calendar-notification-123",
  "message": "Calendar notification sent successfully"
}
```

### 3. Email Service Status
**GET** `/api/notifications/email?status=1`

Check email service status and configuration.

#### Response (Success)
```json
{
  "status": "operational",
  "service": "email",
  "configuration": {
    "host": "localhost",
    "port": 1025,
    "secure": false
  },
  "lastChecked": "2025-10-29T17:00:00.000Z"
}
```

## SMS Notification APIs

### 1. Test SMS Endpoint
**POST** `/api/test-sms`

Send a test SMS notification.

#### Request Body
```json
{
  "to": "+1234567890",
  "body": "Test SMS message from Concierge AI"
}
```

#### Response (Success)
```json
{
  "success": true,
  "messageSid": "SM1234567890abcdef",
  "message": "Test SMS sent successfully"
}
```

### 2. SMS Service Status
**GET** `/api/test-sms?status=1`

Check SMS service status and configuration.

#### Response (Success)
```json
{
  "status": "operational",
  "service": "sms",
  "configuration": {
    "accountSid": "AC...",
    "phoneNumber": "+1234567890"
  },
  "lastChecked": "2025-10-29T17:00:00.000Z"
}
```

## Workflow Execution API

### Execute Workflow
**POST** `/api/workflows/execute`

Execute an AI workflow with notification capabilities.

#### Request Body
```json
{
  "workflowId": "workflow-123",
  "recipientEmail": "user@example.com",
  "sendNotifications": true,
  "parameters": {
    "appointmentType": "medical",
    "duration": 30,
    "location": "Virtual"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "executionId": "exec-123",
  "workflowId": "workflow-123",
  "status": "completed",
  "notificationsSent": {
    "email": true,
    "sms": false
  },
  "calendarEvent": {
    "id": "event-123",
    "title": "Generated Appointment",
    "startDate": "2025-11-01T17:00:00.000Z",
    "endDate": "2025-11-01T17:30:00.000Z"
  }
}
```

## Error Responses

### Common Error Codes
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (endpoint or resource not found)
- `500` - Internal Server Error (service unavailable)

### Error Response Format
```json
{
  "error": "Error message description",
  "status": 400,
  "details": {
    "field": "specific field error details"
  }
}
```

## Rate Limiting
- Email notifications: 100 requests per minute
- SMS notifications: 50 requests per minute
- Workflow execution: 20 requests per minute

## Testing Environment
- **MailHog**: `http://localhost:8025` (email testing)
- **SMTP**: `localhost:1025` (no authentication required)
- **Database**: MongoDB (local or cloud)
