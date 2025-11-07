/**
 * API routes for workflow management
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';

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

async function seedDefaultWorkflows(userId: string) {
  try {
    const seedDocs = mockWorkflows.map((workflow) => ({
      _id: workflow.id,
      userId,
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      steps: workflow.steps || [],
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      approvalRequired: workflow.approvalRequired || false,
      autoExecute: workflow.autoExecute || false,
      isActive: workflow.isActive ?? true,
    }));

    if (seedDocs.length > 0) {
      await WorkflowModel.insertMany(seedDocs, { ordered: false });
    }
  } catch (error) {
    // Ignore duplicate errors (already seeded)
    if (
      !(error instanceof Error) ||
      !error.message.toLowerCase().includes('duplicate')
    ) {
      console.error('Error seeding default workflows:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let workflows = await WorkflowModel.find({ userId: session.user.id })
      .lean()
      .exec();

    if (!workflows || workflows.length === 0) {
      // Seed defaults for first-time user
      await seedDefaultWorkflows(session.user.id);
      workflows = await WorkflowModel.find({ userId: session.user.id })
        .lean()
        .exec();
    }

    const formatted = workflows.map((workflow) => ({
      id: workflow._id,
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      steps: workflow.steps || [],
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      approvalRequired: workflow.approvalRequired,
      autoExecute: workflow.autoExecute,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      workflows: formatted,
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
    const {
      id,
      name,
      description,
      trigger,
      steps,
      nodes,
      edges,
      approvalRequired,
      autoExecute,
      isActive,
    } = body;

    await connectDB();

    const workflowId = id || `workflow_${Date.now()}`;

    const newWorkflow = await WorkflowModel.create({
      _id: workflowId,
      userId: session.user.id,
      name,
      description,
      trigger,
      steps: steps || [],
      nodes: nodes || [],
      edges: edges || [],
      approvalRequired: approvalRequired || false,
      autoExecute: autoExecute || false,
      isActive: isActive ?? false,
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id: newWorkflow._id,
        name: newWorkflow.name,
        description: newWorkflow.description,
        trigger: newWorkflow.trigger,
        steps: newWorkflow.steps,
        nodes: newWorkflow.nodes,
        edges: newWorkflow.edges,
        approvalRequired: newWorkflow.approvalRequired,
        autoExecute: newWorkflow.autoExecute,
        isActive: newWorkflow.isActive,
        createdAt: newWorkflow.createdAt,
        updatedAt: newWorkflow.updatedAt,
      },
      message: 'Workflow created successfully',
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
    const {
      id,
      isActive,
      nodes,
      edges,
      steps,
      name,
      description,
      trigger,
      approvalRequired,
      autoExecute,
    } = body;

    await connectDB();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (steps !== undefined) updateData.steps = steps;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (approvalRequired !== undefined)
      updateData.approvalRequired = approvalRequired;
    if (autoExecute !== undefined) updateData.autoExecute = autoExecute;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedWorkflow = await WorkflowModel.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updateData,
      { new: true }
    ).lean();

    if (!updatedWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: updatedWorkflow._id,
        name: updatedWorkflow.name,
        description: updatedWorkflow.description,
        trigger: updatedWorkflow.trigger,
        steps: updatedWorkflow.steps,
        nodes: updatedWorkflow.nodes,
        edges: updatedWorkflow.edges,
        approvalRequired: updatedWorkflow.approvalRequired,
        autoExecute: updatedWorkflow.autoExecute,
        isActive: updatedWorkflow.isActive,
        createdAt: updatedWorkflow.createdAt,
        updatedAt: updatedWorkflow.updatedAt,
      },
      message: 'Workflow updated successfully',
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
