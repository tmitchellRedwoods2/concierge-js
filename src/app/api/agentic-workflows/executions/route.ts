/**
 * Agentic Workflow Executions API - Get execution logs
 * 
 * GET /api/agentic-workflows/executions
 * Returns execution history for agentic workflows with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongodb';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';

export async function GET(request: NextRequest) {
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

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {
      userId: session.user.id,
    };

    if (workflowId) {
      query.workflowId = workflowId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate).toISOString();
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate).toISOString();
      }
    }

    // Get total count for pagination
    const total = await WorkflowExecution.countDocuments(query).exec();

    // Fetch executions
    const executions = await WorkflowExecution.find(query)
      .sort({ startTime: -1 })
      .skip(offset)
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
      durationMs: exec.endTime
        ? new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()
        : null,
      steps: exec.steps || [],
      triggerData: exec.triggerData,
      result: exec.result,
      calendarEvent: exec.calendarEvent,
      error: exec.error,
      createdAt: exec.createdAt,
      updatedAt: exec.updatedAt,
    }));

    // Calculate summary statistics
    const stats = {
      total,
      completed: executions.filter((e) => e.status === 'completed').length,
      failed: executions.filter((e) => e.status === 'failed').length,
      running: executions.filter((e) => e.status === 'running').length,
      timeout: executions.filter((e) => e.status === 'timeout').length,
    };

    return NextResponse.json({
      success: true,
      executions: formattedExecutions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching execution logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution logs' },
      { status: 500 }
    );
  }
}
