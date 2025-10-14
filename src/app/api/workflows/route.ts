/**
 * API routes for workflow management
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';

// Mock workflow data - in production this would come from database
const mockWorkflows = [
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

    // In a real implementation, this would save to database
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      name,
      description,
      trigger,
      steps,
      approvalRequired: approvalRequired || false,
      autoExecute: autoExecute || false,
      timeoutMs: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 5000
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    return NextResponse.json({
      success: true,
      workflow: newWorkflow
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
