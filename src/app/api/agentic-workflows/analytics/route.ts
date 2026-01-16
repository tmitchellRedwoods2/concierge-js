/**
 * Agentic Workflows Analytics API
 * 
 * GET /api/agentic-workflows/analytics
 * Returns analytics and monitoring data for agentic workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongodb';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import { WorkflowModel } from '@/lib/models/Workflow';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission - admins and agents can view analytics
    const userRole = (session.user as any).role || 'client';
    const accessMode = (session.user as any).accessMode || 'self-service';
    
    if (userRole !== 'admin' && userRole !== 'agent') {
      if (!hasPermission(userRole, 'view:agentic-workflows', accessMode)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const executionQuery: any = {
      startTime: { $gte: startDate.toISOString() },
    };

    if (workflowId) {
      executionQuery.workflowId = workflowId;
    }

    // Get execution statistics
    const executions = await WorkflowExecution.find(executionQuery)
      .lean()
      .exec();

    // Calculate analytics
    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const runningExecutions = executions.filter(e => e.status === 'running').length;
    const timeoutExecutions = executions.filter(e => e.status === 'timeout').length;

    const successRate = totalExecutions > 0 
      ? (completedExecutions / totalExecutions) * 100 
      : 0;

    // Calculate average duration for completed executions
    const completedWithDuration = executions
      .filter(e => e.status === 'completed' && e.endTime && e.startTime)
      .map(e => {
        const start = new Date(e.startTime).getTime();
        const end = new Date(e.endTime!).getTime();
        return end - start;
      });

    const avgDurationMs = completedWithDuration.length > 0
      ? completedWithDuration.reduce((a, b) => a + b, 0) / completedWithDuration.length
      : 0;

    // Get workflow statistics
    const workflowStats = await WorkflowExecution.aggregate([
      { $match: executionQuery },
      {
        $group: {
          _id: '$workflowId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          running: { $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] } },
        },
      },
    ]).exec();

    // Get workflow names
    const workflowIds = workflowStats.map(s => s._id);
    const workflows = await WorkflowModel.find({
      _id: { $in: workflowIds },
    })
      .select('_id name')
      .lean()
      .exec();

    const workflowMap = new Map(workflows.map(w => [w._id, w.name]));
    
    const enrichedWorkflowStats = workflowStats.map(stat => ({
      workflowId: stat._id,
      workflowName: workflowMap.get(stat._id) || 'Unknown',
      total: stat.total,
      completed: stat.completed,
      failed: stat.failed,
      running: stat.running,
      successRate: stat.total > 0 ? (stat.completed / stat.total) * 100 : 0,
    }));

    // Error rate by workflow
    const errorRate = totalExecutions > 0
      ? ((failedExecutions + timeoutExecutions) / totalExecutions) * 100
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalExecutions,
          completedExecutions,
          failedExecutions,
          runningExecutions,
          timeoutExecutions,
          successRate: Math.round(successRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          avgDurationMs: Math.round(avgDurationMs),
        },
        workflowStats: enrichedWorkflowStats.sort((a, b) => b.total - a.total),
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
