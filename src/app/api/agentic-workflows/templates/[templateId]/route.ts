/**
 * Agentic Workflow Template API - Get template by ID
 * 
 * GET /api/agentic-workflows/templates/[templateId]
 * Returns a specific workflow template
 * 
 * POST /api/agentic-workflows/templates/[templateId]
 * Instantiates a template as a workflow for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';
import { getTemplateById } from '@/lib/services/workflow-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
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

    const { templateId } = await params;
    const template = getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('❌ Error fetching workflow template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow template' },
      { status: 500 }
    );
  }
}

/**
 * Instantiate a template as a workflow for the current user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and agents can instantiate templates
    const userRole = (session.user as any).role || 'client';
    if (userRole !== 'admin' && userRole !== 'agent') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins and agents can instantiate templates' },
        { status: 403 }
      );
    }

    const { templateId } = await params;
    const template = getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    await connectDB();

    // Get optional body parameters for customization
    const body = await request.json().catch(() => ({}));
    const {
      name,
      targetAccessMode,
      executionPriority,
      isActive = false, // Templates start inactive by default
    } = body;

    // Create workflow from template
    const workflowId = `workflow_${Date.now()}_${templateId}`;
    const workflow = await WorkflowModel.create({
      _id: workflowId,
      userId: session.user.id,
      name: name || template.name,
      description: template.description,
      trigger: template.trigger,
      steps: template.steps,
      nodes: template.nodes,
      edges: template.edges,
      approvalRequired: false,
      autoExecute: true,
      isActive,
      isAgentic: template.isAgentic,
      targetAccessMode: targetAccessMode || template.targetAccessMode,
      autoApprove: template.autoApprove,
      executionPriority: executionPriority || template.executionPriority,
      maxRetries: template.maxRetries,
      retryDelayMs: template.retryDelayMs,
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow._id,
        name: workflow.name,
        description: workflow.description,
        isAgentic: workflow.isAgentic,
        targetAccessMode: workflow.targetAccessMode,
        isActive: workflow.isActive,
      },
      message: 'Workflow created from template successfully',
    });
  } catch (error) {
    console.error('❌ Error instantiating workflow template:', error);
    return NextResponse.json(
      { error: 'Failed to instantiate workflow template' },
      { status: 500 }
    );
  }
}
