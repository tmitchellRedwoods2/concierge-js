/**
 * Default Agentic Workflow Templates
 * Pre-configured workflows for common hands-off use cases
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'finance' | 'travel' | 'calendar' | 'expenses';
  trigger: {
    type: string;
    conditions: any[];
  };
  steps: any[];
  nodes: any[];
  edges: any[];
  isAgentic: boolean;
  targetAccessMode: string[];
  autoApprove: boolean;
  executionPriority: number;
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_AGENTIC_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'email-appointment-scheduling',
    name: 'Email Appointment Scheduling',
    description: 'Automatically schedule appointments from emails. Detects appointment requests and creates calendar events.',
    category: 'health',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'content', operator: 'contains', value: 'appointment' },
        { field: 'content', operator: 'contains', value: 'schedule' },
      ],
    },
    steps: [
      {
        id: 'parse_email',
        name: 'Parse Email Content',
        type: 'ai_processing',
        config: {
          prompt: 'Extract appointment details from email: provider name, date, time, location, reason for visit',
        },
        dependencies: [],
      },
      {
        id: 'create_calendar_event',
        name: 'Create Calendar Event',
        type: 'automation_rule',
        config: {
          ruleId: 'medical-appointment-detection',
        },
        dependencies: ['parse_email'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Email Trigger',
          triggerType: 'email',
          conditions: [
            { field: 'content', operator: 'contains', value: 'appointment' },
          ],
        },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'Extract Appointment Details',
          prompt: 'Extract appointment details from email',
          model: 'claude-3-sonnet',
        },
      },
      {
        id: 'automation-rule-1',
        type: 'automation_rule',
        position: { x: 500, y: 100 },
        data: {
          label: 'Create Calendar Event',
          ruleId: 'medical-appointment-detection',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 700, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'automation-rule-1', type: 'default' },
      { id: 'e3-4', source: 'automation-rule-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off'],
    autoApprove: true,
    executionPriority: 8,
    maxRetries: 3,
    retryDelayMs: 5000,
  },
  {
    id: 'prescription-refill-automation',
    name: 'Prescription Refill Automation',
    description: 'Automatically refill prescriptions when eligible. Monitors prescription expiration and refill eligibility.',
    category: 'health',
    trigger: {
      type: 'schedule',
      conditions: [
        { field: 'type', operator: 'equals', value: 'daily_check' },
        { field: 'time', operator: 'equals', value: '09:00' },
      ],
    },
    steps: [
      {
        id: 'check_prescriptions',
        name: 'Check Prescription Status',
        type: 'api_call',
        config: {
          url: '/api/health/prescriptions',
          method: 'GET',
        },
        dependencies: [],
      },
      {
        id: 'identify_eligible',
        name: 'Identify Eligible Refills',
        type: 'ai_processing',
        config: {
          prompt: 'Identify prescriptions eligible for refill based on expiration date and refill eligibility',
        },
        dependencies: ['check_prescriptions'],
      },
      {
        id: 'submit_refills',
        name: 'Submit Refill Requests',
        type: 'api_call',
        config: {
          url: '/api/health/prescriptions/refill',
          method: 'POST',
        },
        dependencies: ['identify_eligible'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Schedule Trigger',
          triggerType: 'schedule',
        },
      },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 300, y: 100 },
        data: {
          label: 'Check Prescriptions',
          method: 'GET',
          url: '/api/health/prescriptions',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'api-1', type: 'default' },
      { id: 'e2-3', source: 'api-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off'],
    autoApprove: true,
    executionPriority: 7,
    maxRetries: 2,
    retryDelayMs: 10000,
  },
  {
    id: 'calendar-event-management',
    name: 'Calendar Event Management',
    description: 'Automatically accept or decline calendar invites based on rules. Manages calendar conflicts intelligently.',
    category: 'calendar',
    trigger: {
      type: 'calendar_event',
      conditions: [
        { field: 'type', operator: 'equals', value: 'invite' },
      ],
    },
    steps: [
      {
        id: 'analyze_invite',
        name: 'Analyze Calendar Invite',
        type: 'ai_processing',
        config: {
          prompt: 'Analyze calendar invite: check for conflicts, priority, attendee relationships',
        },
        dependencies: [],
      },
      {
        id: 'decide_action',
        name: 'Decide Accept/Decline',
        type: 'automation_rule',
        config: {
          ruleId: 'calendar-invite-rules',
        },
        dependencies: ['analyze_invite'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Calendar Invite Trigger',
          triggerType: 'calendar_event',
        },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'Analyze Invite',
          prompt: 'Analyze calendar invite for conflicts',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off', 'self-service'],
    autoApprove: true,
    executionPriority: 6,
    maxRetries: 2,
    retryDelayMs: 3000,
  },
  {
    id: 'expense-categorization',
    name: 'Expense Categorization',
    description: 'Automatically categorize expenses from receipts and transactions. Improves expense tracking accuracy.',
    category: 'expenses',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'subject', operator: 'contains', value: 'receipt' },
        { field: 'attachments', operator: 'exists', value: true },
      ],
    },
    steps: [
      {
        id: 'extract_receipt',
        name: 'Extract Receipt Data',
        type: 'ai_processing',
        config: {
          prompt: 'Extract expense details from receipt: amount, merchant, date, category',
        },
        dependencies: [],
      },
      {
        id: 'categorize',
        name: 'Categorize Expense',
        type: 'automation_rule',
        config: {
          ruleId: 'expense-categorization',
        },
        dependencies: ['extract_receipt'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Receipt Email Trigger',
          triggerType: 'email',
        },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'Extract Receipt Data',
          prompt: 'Extract expense from receipt',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off', 'self-service'],
    autoApprove: true,
    executionPriority: 5,
    maxRetries: 3,
    retryDelayMs: 5000,
  },
  {
    id: 'insurance-claim-filing',
    name: 'Insurance Claim Filing',
    description: 'Automatically file insurance claims from medical bills and statements. Reduces manual paperwork.',
    category: 'finance',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'content', operator: 'contains', value: 'medical bill' },
        { field: 'content', operator: 'contains', value: 'statement' },
      ],
    },
    steps: [
      {
        id: 'extract_bill_details',
        name: 'Extract Bill Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract medical bill details: provider, amount, date of service, claim type',
        },
        dependencies: [],
      },
      {
        id: 'file_claim',
        name: 'File Insurance Claim',
        type: 'api_call',
        config: {
          url: '/api/insurance/claims',
          method: 'POST',
        },
        dependencies: ['extract_bill_details'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Medical Bill Email Trigger',
          triggerType: 'email',
        },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'Extract Bill Details',
          prompt: 'Extract insurance claim details',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off'],
    autoApprove: true,
    executionPriority: 7,
    maxRetries: 3,
    retryDelayMs: 5000,
  },
  {
    id: 'travel-booking-confirmation',
    name: 'Travel Booking Confirmation',
    description: 'Automatically confirm travel bookings from emails. Extracts booking details and adds to calendar.',
    category: 'travel',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'from', operator: 'contains', value: 'booking' },
        { field: 'subject', operator: 'contains', value: 'confirmation' },
      ],
    },
    steps: [
      {
        id: 'extract_booking',
        name: 'Extract Booking Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract travel booking details: flight/hotel, dates, confirmation number, times',
        },
        dependencies: [],
      },
      {
        id: 'create_calendar',
        name: 'Create Calendar Events',
        type: 'automation_rule',
        config: {
          ruleId: 'travel-booking-calendar',
        },
        dependencies: ['extract_booking'],
      },
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Travel Confirmation Email',
          triggerType: 'email',
        },
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'Extract Booking',
          prompt: 'Extract travel booking details',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'end-1', type: 'default' },
    ],
    isAgentic: true,
    targetAccessMode: ['hands-off', 'self-service'],
    autoApprove: true,
    executionPriority: 6,
    maxRetries: 2,
    retryDelayMs: 5000,
  },
];

/**
 * Get all workflow templates
 */
export function getAllTemplates(): WorkflowTemplate[] {
  return DEFAULT_AGENTIC_WORKFLOW_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: WorkflowTemplate['category']
): WorkflowTemplate[] {
  return DEFAULT_AGENTIC_WORKFLOW_TEMPLATES.filter(
    (template) => template.category === category
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return DEFAULT_AGENTIC_WORKFLOW_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get templates for access mode
 */
export function getTemplatesForAccessMode(
  accessMode: string
): WorkflowTemplate[] {
  return DEFAULT_AGENTIC_WORKFLOW_TEMPLATES.filter(
    (template) =>
      template.targetAccessMode.includes(accessMode) ||
      template.targetAccessMode.length === 0
  );
}
