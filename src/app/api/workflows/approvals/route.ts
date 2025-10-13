/**
 * API routes for workflow approval management
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { WorkflowExecutionEngine } from '@/lib/workflows/execution-engine';

// Global execution engine instance
let executionEngine: WorkflowExecutionEngine | null = null;

function getExecutionEngine(): WorkflowExecutionEngine {
  if (!executionEngine) {
    executionEngine = new WorkflowExecutionEngine();
  }
  return executionEngine;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const engine = getExecutionEngine();
    const executions = engine.getAllExecutions(session.user.id);

    // Filter for pending approvals
    const pendingApprovals = executions.filter(exec => exec.status === 'awaiting_approval');

    return NextResponse.json({
      success: true,
      approvals: pendingApprovals
    });

  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { approvalToken, approved } = body;

    if (!approvalToken || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approval token and decision are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const engine = getExecutionEngine();
    const result = await engine.approveWorkflow(approvalToken, approved);

    return NextResponse.json({
      success: true,
      result,
      message: approved ? 'Workflow approved' : 'Workflow rejected'
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
