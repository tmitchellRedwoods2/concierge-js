/**
 * Agentic Workflow Details API - Get workflow details and execution history
 * 
 * GET /api/agentic-workflows/[id]
 * Returns workflow details and recent execution history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const userRole = (session.user as any).role || 'client';
    const accessMode = (session.user as any).accessMode || 'self-service';
    
    if (!hasPermission(userRole, 'view:agentic-workflows', accessMode)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await connectDB();

    // Find the workflow
    const workflow = await WorkflowModel.findById(id).lean().exec();

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this workflow
    if (workflow.userId !== session.user.id) {
      // For non-owners, check if workflow targets their access mode
      if (userRole === 'client' && accessMode) {
        const hasAccess =
          (workflow.targetAccessMode || []).includes(accessMode) ||
          (workflow.targetAccessMode || []).length === 0;
        
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden - Workflow not accessible' },
            { status: 403 }
          );
        }
      }
    }

    // Get recent executions (last 20)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // Optional filter by status

    const executionQuery: any = {
      workflowId: id,
      userId: session.user.id,
    };

    if (status) {
      executionQuery.status = status;
    }

    const executions = await WorkflowExecution.find(executionQuery)
      .sort({ startTime: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Format executions
    const formattedExecutions = executions.map((exec) => ({
      id: exec.id,
      workflowId: exec.workflowId,
      workflowName: exec.workflowName,
      status: exec.status,
      startTime: exec.startTime,
      endTime: exec.endTime,
      steps: exec.steps || [],
      triggerData: exec.triggerData,
      result: exec.result,
      calendarEvent: exec.calendarEvent,
      error: exec.error,
      createdAt: exec.createdAt,
      updatedAt: exec.updatedAt,
    }));

    // Format workflow
    const formattedWorkflow = {
      id: workflow._id,
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      steps: workflow.steps || [],
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      isAgentic: workflow.isAgentic || false,
      targetAccessMode: workflow.targetAccessMode || [],
      autoApprove: workflow.autoApprove ?? true,
      executionPriority: workflow.executionPriority || 5,
      maxRetries: workflow.maxRetries || 3,
      retryDelayMs: workflow.retryDelayMs || 5000,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };

    // Calculate execution statistics
    const stats = {
      total: executions.length,
      completed: executions.filter((e) => e.status === 'completed').length,
      failed: executions.filter((e) => e.status === 'failed').length,
      running: executions.filter((e) => e.status === 'running').length,
      timeout: executions.filter((e) => e.status === 'timeout').length,
    };

    return NextResponse.json({
      success: true,
      workflow: formattedWorkflow,
      executions: formattedExecutions,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching agentic workflow details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow details' },
      { status: 500 }
    );
  }
}
