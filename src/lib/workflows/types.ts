/**
 * Core types for autonomous AI workflows
 */

export interface EventSource {
  id: string;
  type: 'email' | 'voicemail' | 'calendar' | 'webhook' | 'sms' | 'notification';
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userId: string;
  sourceId?: string; // External ID (email ID, voicemail ID, etc.)
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Intent {
  id: string;
  type: 'appointment' | 'prescription' | 'claim' | 'payment' | 'notification' | 'general';
  confidence: number;
  entities: Record<string, any>;
  action: string;
  parameters: Record<string, any>;
  requiresApproval: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'api_call' | 'data_update' | 'notification' | 'approval' | 'ai_processing';
  config: Record<string, any>;
  dependencies: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: EventTrigger;
  steps: WorkflowStep[];
  approvalRequired: boolean;
  autoExecute: boolean;
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface EventTrigger {
  type: 'email_content' | 'voicemail_content' | 'calendar_event' | 'webhook' | 'schedule';
  conditions: TriggerCondition[];
  filters?: Record<string, any>;
}

export interface TriggerCondition {
  field: string;
  operator: 'contains' | 'equals' | 'matches' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval';
  currentStep?: string;
  steps: WorkflowStepExecution[];
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface WorkflowStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  retryCount: number;
}

export interface UserContext {
  userId: string;
  preferences: UserPreferences;
  history: UserHistory;
  permissions: UserPermissions;
}

export interface UserPreferences {
  autoApproveAppointments: boolean;
  autoApprovePrescriptions: boolean;
  autoApproveClaims: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface UserHistory {
  recentAppointments: any[];
  recentPrescriptions: any[];
  recentClaims: any[];
  aiInteractions: any[];
}

export interface UserPermissions {
  canScheduleAppointments: boolean;
  canManagePrescriptions: boolean;
  canFileClaims: boolean;
  canAccessFinancialData: boolean;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresApproval: boolean;
  approvalToken?: string;
  nextSteps?: string[];
}
