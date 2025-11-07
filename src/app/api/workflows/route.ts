/**
 * API routes for workflow management
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';

// Mock workflow data - in production this would come from database
let mockWorkflows = [
  {
    id: 'fresh-appointment-scheduler',
    name: 'Fresh Appointment Scheduler',
    description: 'Clean workflow for scheduling appointments with calendar integration',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'content', operator: 'contains', value: 'appointment' }
      ]
    },
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Email Trigger',
          triggerType: 'email',
          conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }]
        }
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'AI Processing',
          prompt: 'Extract appointment details from email',
          model: 'claude-3-sonnet',
          temperature: 0.3
        }
      },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 500, y: 100 },
        data: {
          label: 'API Call',
          method: 'POST',
          url: 'https://api.calendar.com/appointments',
          headers: {},
          body: {}
        }
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 700, y: 100 },
        data: {
          label: 'End',
          result: 'success'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'api-1', type: 'default' },
      { id: 'e3-4', source: 'api-1', target: 'end-1', type: 'default' }
    ],
    steps: [
      {
        id: 'extract_details',
        name: 'Extract Appointment Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract appointment details from: {intent.content}'
        },
        dependencies: []
      },
      {
        id: 'schedule_appointment',
        name: 'Schedule Appointment',
        type: 'api_call',
        config: {
          url: '/api/health/appointments',
          method: 'POST',
          body: {
            provider: '{intent.entities.provider}',
            date: '{intent.entities.date}',
            time: '{intent.entities.time}',
            reason: '{intent.entities.reason}'
          }
        },
        dependencies: ['extract_details']
      }
    ],
    approvalRequired: false,
    autoExecute: false,
    isActive: true,
    timeoutMs: 300000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 5000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'schedule-appointment',
    name: 'Schedule Appointment',
    description: 'Automatically schedule appointments based on email/voicemail requests',
    trigger: {
      type: 'email_content',
      conditions: [
        { field: 'content', operator: 'contains', value: 'appointment' }
      ]
    },
    steps: [
      {
        id: 'extract_details',
        name: 'Extract Appointment Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract appointment details from: {intent.content}'
        },
        dependencies: []
      },
      {
        id: 'schedule_appointment',
        name: 'Schedule Appointment',
        type: 'api_call',
        config: {
          url: '/api/health/appointments',
          method: 'POST',
          body: {
            provider: '{intent.entities.provider}',
            date: '{intent.entities.date}',
            time: '{intent.entities.time}',
            reason: '{intent.entities.reason}'
          }
        },
        dependencies: ['extract_details']
      }
    ],
    approvalRequired: true,
    autoExecute: false,
    timeoutMs: 300000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 5000
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 'refill-prescription',
    name: 'Refill Prescription',
    description: 'Automatically refill prescriptions based on email/voicemail requests',
    trigger: {
      type: 'email_content',
      conditions: [
        { field: 'content', operator: 'contains', value: 'prescription' }
      ]
    },
    steps: [
      {
        id: 'extract_medication',
        name: 'Extract Medication Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract medication details from: {intent.content}'
        },
        dependencies: []
      },
      {
        id: 'refill_prescription',
        name: 'Refill Prescription',
        type: 'api_call',
        config: {
          url: '/api/health/prescriptions',
          method: 'POST',
          body: {
            medication: '{intent.entities.medication}',
            pharmacy: '{intent.entities.pharmacy}',
            quantity: '{intent.entities.quantity}'
          }
        },
        dependencies: ['extract_medication']
      }
    ],
    approvalRequired: true,
    autoExecute: false,
    timeoutMs: 300000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 5000
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 'file-insurance-claim',
    name: 'File Insurance Claim',
    description: 'Automatically file insurance claims based on email/voicemail requests',
    trigger: {
      type: 'email_content',
      conditions: [
        { field: 'content', operator: 'contains', value: 'claim' }
      ]
    },
    steps: [
      {
        id: 'extract_claim_details',
        name: 'Extract Claim Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract insurance claim details from: {intent.content}'
        },
        dependencies: []
      },
      {
        id: 'file_claim',
        name: 'File Insurance Claim',
        type: 'api_call',
        config: {
          url: '/api/insurance/claims',
          method: 'POST',
          body: {
            policyId: '{intent.entities.policyId}',
            claimType: '{intent.entities.claimType}',
            amount: '{intent.entities.amount}',
            description: '{intent.entities.description}'
          }
        },
        dependencies: ['extract_claim_details']
      }
    ],
    approvalRequired: true,
    autoExecute: false,
    timeoutMs: 300000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 5000
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 'test-automation-rule-workflow',
    name: 'Test Workflow with Automation Rule',
    description: 'Test workflow that uses an automation rule for Google Calendar/Gmail integration',
    trigger: {
      type: 'email',
      conditions: [
        { field: 'content', operator: 'contains', value: 'appointment' }
      ]
    },
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Email Trigger',
          triggerType: 'email',
          conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }]
        }
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 100 },
        data: {
          label: 'AI Processing',
          prompt: 'Extract appointment details from email',
          model: 'claude-3-sonnet',
          temperature: 0.3
        }
      },
      {
        id: 'automation-rule-1',
        type: 'automation_rule',
        position: { x: 500, y: 100 },
        data: {
          label: 'Create Calendar Event',
          ruleId: '', // Will be set when user selects a rule
          ruleName: 'Medical Appointment Detection' // Example rule name
        }
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 700, y: 100 },
        data: {
          label: 'End',
          result: 'success'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
      { id: 'e2-3', source: 'ai-1', target: 'automation-rule-1', type: 'default' },
      { id: 'e3-4', source: 'automation-rule-1', target: 'end-1', type: 'default' }
    ],
    steps: [
      {
        id: 'extract_details',
        name: 'Extract Appointment Details',
        type: 'ai_processing',
        config: {
          prompt: 'Extract appointment details from: {intent.content}'
        },
        dependencies: []
      },
      {
        id: 'execute_automation_rule',
        name: 'Execute Automation Rule',
        type: 'automation_rule',
        config: {
          ruleId: 'medical-appointment-detection' // Example rule ID
        },
        dependencies: ['extract_details']
      }
    ],
    approvalRequired: false,
    autoExecute: false,
    isActive: false, // Start inactive for testing
    timeoutMs: 300000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 5000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Return available workflows
    return NextResponse.json({
      success: true,
      workflows: mockWorkflows
    });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger, steps, approvalRequired, autoExecute } = body;

    await connectDB();

    // Create new workflow
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      name,
      description,
      trigger,
      steps: steps || [],
      approvalRequired: approvalRequired || false,
      autoExecute: autoExecute || false,
      timeoutMs: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 5000
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false // New workflows start inactive
    };

    // Add to mock workflows array (in production, save to database)
    mockWorkflows.push(newWorkflow);

    return NextResponse.json({
      success: true,
      workflow: newWorkflow,
      message: 'Workflow created successfully'
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    await connectDB();

    // Find and update workflow
    const workflowIndex = mockWorkflows.findIndex(w => w.id === id);
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Update workflow
    mockWorkflows[workflowIndex] = {
      ...mockWorkflows[workflowIndex],
      isActive: isActive !== undefined ? isActive : mockWorkflows[workflowIndex].isActive,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      workflow: mockWorkflows[workflowIndex],
      message: 'Workflow updated successfully'
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
    }

    await connectDB();

    // Find and remove workflow
    const workflowIndex = mockWorkflows.findIndex(w => w.id === id);
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Remove workflow
    const deletedWorkflow = mockWorkflows.splice(workflowIndex, 1)[0];

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
      deletedWorkflow
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
