/**
 * Agentic Workflow Assignment Service
 * Handles automatic assignment of default agentic workflows to users
 */

import connectDB from '@/lib/db/mongodb';
import { WorkflowModel } from '@/lib/models/Workflow';
import { AccessMode } from '@/lib/db/models/User';
import { getTemplatesForAccessMode } from './workflow-templates';

/**
 * Assign default agentic workflows to a user based on their access mode
 */
export async function assignDefaultAgenticWorkflows(
  userId: string,
  accessMode: AccessMode
): Promise<void> {
  try {
    await connectDB();

    // Only assign to hands-off users by default
    // Admins can manually create workflows for other access modes
    if (accessMode !== 'hands-off') {
      return;
    }

    // Get templates for hands-off access mode
    const templates = getTemplatesForAccessMode('hands-off');

    if (templates.length === 0) {
      return;
    }

    // Check if workflows already exist for this user
    const existingWorkflows = await WorkflowModel.find({
      userId,
      isAgentic: true,
    })
      .lean()
      .exec();

    const existingWorkflowIds = new Set(
      existingWorkflows.map((w) => w._id.toString())
    );

    // Create workflows from templates that don't already exist
    const workflowsToCreate = templates
      .filter((template) => {
        // Create unique ID based on template ID and user ID
        const workflowId = `agentic_${template.id}_${userId}`;
        return !existingWorkflowIds.has(workflowId);
      })
      .map((template) => ({
        _id: `agentic_${template.id}_${userId}`,
        userId,
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        steps: template.steps,
        nodes: template.nodes,
        edges: template.edges,
        approvalRequired: false,
        autoExecute: true,
        isActive: true, // Auto-activate for hands-off users
        isAgentic: template.isAgentic,
        targetAccessMode: template.targetAccessMode,
        autoApprove: template.autoApprove,
        executionPriority: template.executionPriority,
        maxRetries: template.maxRetries,
        retryDelayMs: template.retryDelayMs,
      }));

    if (workflowsToCreate.length > 0) {
      await WorkflowModel.insertMany(workflowsToCreate, { ordered: false });
      console.log(
        `✅ Assigned ${workflowsToCreate.length} agentic workflows to user ${userId}`
      );
    }
  } catch (error) {
    // Don't throw - we don't want to block user creation if workflow assignment fails
    console.error(
      `❌ Error assigning default agentic workflows to user ${userId}:`,
      error
    );
  }
}

/**
 * Assign a specific template to a user
 */
export async function assignTemplateToUser(
  userId: string,
  templateId: string,
  options?: {
    name?: string;
    targetAccessMode?: AccessMode[];
    executionPriority?: number;
    isActive?: boolean;
  }
): Promise<string | null> {
  try {
    await connectDB();

    const { getTemplateById } = await import('./workflow-templates');
    const template = getTemplateById(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflowId = `agentic_${templateId}_${userId}_${Date.now()}`;

    const workflow = await WorkflowModel.create({
      _id: workflowId,
      userId,
      name: options?.name || template.name,
      description: template.description,
      trigger: template.trigger,
      steps: template.steps,
      nodes: template.nodes,
      edges: template.edges,
      approvalRequired: false,
      autoExecute: true,
      isActive: options?.isActive ?? false,
      isAgentic: template.isAgentic,
      targetAccessMode: options?.targetAccessMode || template.targetAccessMode,
      autoApprove: template.autoApprove,
      executionPriority: options?.executionPriority || template.executionPriority,
      maxRetries: template.maxRetries,
      retryDelayMs: template.retryDelayMs,
    });

    return workflow._id;
  } catch (error) {
    console.error(
      `❌ Error assigning template ${templateId} to user ${userId}:`,
      error
    );
    return null;
  }
}
