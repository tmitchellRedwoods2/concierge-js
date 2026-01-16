/**
 * Agentic Workflows API - List agentic workflows for current user
 * 
 * GET /api/agentic-workflows
 * Returns all agentic workflows accessible to the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';

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

    // Build query: find agentic workflows that match user's access mode
    const query: any = {
      isAgentic: true,
      isActive: true,
    };

    // For clients, only show workflows targeting their access mode
    if (userRole === 'client' && accessMode) {
      query.$or = [
        { targetAccessMode: { $in: [accessMode] } },
        { targetAccessMode: { $size: 0 } }, // Workflows with no target (for all)
        { userId: session.user.id }, // User's own workflows
      ];
    } else if (userRole === 'admin') {
      // Admins can see all agentic workflows
      // No additional filter needed
    } else if (userRole === 'agent') {
      // Agents can see workflows for their clients or all hands-off workflows
      query.$or = [
        { targetAccessMode: { $in: ['hands-off'] } },
        { targetAccessMode: { $size: 0 } },
      ];
    }

    const workflows = await WorkflowModel.find(query)
      .sort({ executionPriority: -1, createdAt: -1 })
      .lean()
      .exec();

    // Format workflows for response
    const formatted = workflows.map((workflow) => ({
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
    }));

    return NextResponse.json({
      success: true,
      workflows: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('❌ Error fetching agentic workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agentic workflows' },
      { status: 500 }
    );
  }
}
