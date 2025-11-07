# AI Node to Automation Rule Data Flow

## Overview

The AI Node extracts structured data from email messages and passes it to Automation Rule nodes. This document explains how the data flows and how to use AI-extracted data in automation rule actions.

## Data Flow

```
Email Trigger → AI Node → Automation Rule Node
     ↓              ↓              ↓
  Raw Email    Structured    Uses AI Data
  Content      Data          in Actions
```

## AI Node Purpose

The **AI Node** is responsible for:
1. **Parsing email content** using AI (Gemini/Claude)
2. **Extracting structured data** from unstructured email text
3. **Providing structured output** that automation rules can use

### Example AI Extraction

**Input Email:**
```
Subject: Appointment Request
From: john@example.com

Hi, I'd like to schedule an appointment with Dr. Smith 
on January 15th at 2:00 PM. The appointment should be 
about 60 minutes. Location: 123 Medical Center.
```

**AI Node Output:**
```json
{
  "date": "2024-01-15",
  "time": "14:00",
  "duration": 60,
  "attendee": "john@example.com",
  "location": "123 Medical Center",
  "title": "Appointment with Dr. Smith",
  "doctor": "Dr. Smith",
  "type": "medical"
}
```

## Automation Rule Template Variables

Automation rules can use **template variables** to access AI-extracted data in their action configs.

### Template Variable Syntax

Use `{path.to.data}` syntax to reference data:

- `{aiResult.date}` - Date extracted by AI
- `{aiResult.time}` - Time extracted by AI
- `{aiResult.location}` - Location extracted by AI
- `{aiResult.attendee}` - Attendee email extracted by AI
- `{triggerResult.email}` - Original email address
- `{triggerResult.content}` - Original email content

### Example: Using AI Data in Calendar Event

**Automation Rule Action Config:**
```json
{
  "type": "create_calendar_event",
  "config": {
    "title": "Appointment: {aiResult.title}",
    "startDate": "{aiResult.date}T{aiResult.time}",
    "endDate": "{aiResult.date}T{aiResult.time}",
    "location": "{aiResult.location}",
    "description": "Appointment scheduled via workflow. Original email: {triggerResult.email}",
    "attendees": ["{aiResult.attendee}"]
  }
}
```

**Resolved Config (after template variable resolution):**
```json
{
  "type": "create_calendar_event",
  "config": {
    "title": "Appointment: Appointment with Dr. Smith",
    "startDate": "2024-01-15T14:00",
    "endDate": "2024-01-15T14:00",
    "location": "123 Medical Center",
    "description": "Appointment scheduled via workflow. Original email: john@example.com",
    "attendees": ["john@example.com"]
  }
}
```

### Example: Using AI Data in Email

**Automation Rule Action Config:**
```json
{
  "type": "send_email",
  "config": {
    "to": "{aiResult.attendee}",
    "subject": "Appointment Confirmation: {aiResult.title}",
    "template": "appointment_confirmation",
    "data": {
      "title": "{aiResult.title}",
      "date": "{aiResult.date}",
      "time": "{aiResult.time}",
      "location": "{aiResult.location}",
      "doctor": "{aiResult.doctor}"
    }
  }
}
```

## Workflow Context Structure

When an automation rule executes in a workflow, it receives this context:

```json
{
  "executionId": "exec_1234567890",
  "workflowExecutionId": "exec_1234567890",
  "workflowStep": "automation-rule-1",
  "aiResult": {
    "date": "2024-01-15",
    "time": "14:00",
    "duration": 60,
    "attendee": "john@example.com",
    "location": "123 Medical Center",
    "title": "Appointment with Dr. Smith"
  },
  "triggerResult": {
    "email": "john@example.com",
    "content": "I'd like to schedule an appointment..."
  },
  "calendarEventId": "event_123" // If created earlier in workflow
}
```

## Best Practices

### 1. Structure AI Output

Design your AI Node prompts to extract structured data:
- Use consistent field names (date, time, location, etc.)
- Include all data needed by automation rules
- Validate extracted data format

### 2. Use Template Variables

In automation rule action configs:
- Use `{aiResult.fieldName}` for AI-extracted data
- Use `{triggerResult.fieldName}` for trigger data
- Provide fallback values if needed

### 3. Error Handling

- If a template variable is not found, it remains as `{variableName}`
- Check action configs after resolution to ensure all variables were resolved
- Log warnings for unresolved variables

### 4. Data Validation

- Validate AI-extracted data before passing to automation rules
- Ensure dates/times are in correct format
- Check required fields are present

## Example Workflow

1. **Trigger Node**: Receives email "I need an appointment on Jan 15 at 2 PM"
2. **AI Node**: Extracts:
   ```json
   {
     "date": "2024-01-15",
     "time": "14:00",
     "title": "Appointment"
   }
   ```
3. **Automation Rule Node**: Uses template variables:
   - `{aiResult.date}` → "2024-01-15"
   - `{aiResult.time}` → "14:00"
   - Creates calendar event with AI-extracted data

## Implementation Details

The template variable resolution happens in `executeAutomationRuleNode()`:

1. **Context Preparation**: All workflow data is structured for template resolution
2. **Template Resolution**: `resolveTemplateVariables()` replaces `{path}` with actual values
3. **Action Execution**: Resolved action configs are passed to `executeSingleAction()`

## Future Enhancements

- **AI Node Integration**: Connect to actual AI service (Gemini/Claude) for email parsing
- **Data Validation**: Validate AI-extracted data before use
- **Error Recovery**: Handle missing or invalid AI data gracefully
- **Data Transformation**: Transform AI data to match automation rule requirements

