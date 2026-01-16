/**
 * Agentic Workflow Executor Service
 * 
 * Handles automatic execution of agentic workflows for hands-off users.
 * Monitors triggers, executes workflows, and handles retries.
 */

import connectDB from '@/lib/db/mongodb';
import { WorkflowModel, WorkflowDocument } from '@/lib/models/Workflow';
import { WorkflowExecution, IWorkflowExecution } from '@/lib/models/WorkflowExecution';
import { AccessMode } from '@/lib/db/models/User';
import { automationEngine } from './automation-engine';
import { EventEmitter } from 'events';

export interface AgenticWorkflowTrigger {
  type: 'email' | 'schedule' | 'calendar_event' | 'webhook' | 'time_based';
  data: any;
  userId: string;
  timestamp: Date;
}

export interface AgenticExecutionResult {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'retrying';
  result?: any;
  error?: string;
  retryCount: number;
  durationMs: number;
}

export class AgenticWorkflowExecutor extends EventEmitter {
  private executionQueue: Array<{
    workflow: WorkflowDocument;
    trigger: AgenticWorkflowTrigger;
    retryCount: number;
  }> = [];
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startProcessingLoop();
  }

  /**
   * Start the processing loop to execute queued workflows
   */
  private startProcessingLoop(): void {
    // Process queue every 5 seconds
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processQueue();
      }
    }, 5000);
  }

  /**
   * Stop the processing loop
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Sort by priority (higher priority first)
      this.executionQueue.sort((a, b) => {
        const priorityA = a.workflow.executionPriority || 5;
        const priorityB = b.workflow.executionPriority || 5;
        return priorityB - priorityA;
      });

      // Process up to 5 workflows at a time
      const batch = this.executionQueue.splice(0, 5);
      
      await Promise.allSettled(
        batch.map(item => this.executeWorkflow(item.workflow, item.trigger, item.retryCount))
      );
    } catch (error) {
      console.error('Error processing agentic workflow queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Queue a workflow for execution
   */
  public async queueWorkflow(
    workflow: WorkflowDocument,
    trigger: AgenticWorkflowTrigger
  ): Promise<void> {
    this.executionQueue.push({
      workflow,
      trigger,
      retryCount: 0,
    });

    this.emit('workflow-queued', { workflowId: workflow._id, trigger });
  }

  /**
   * Execute an agentic workflow
   */
  public async executeWorkflow(
    workflow: WorkflowDocument,
    trigger: AgenticWorkflowTrigger,
    retryCount: number = 0
  ): Promise<AgenticExecutionResult> {
    const executionId = `agentic_${workflow._id}_${Date.now()}`;
    const startTime = Date.now();

    console.log(`🤖 Executing agentic workflow: ${workflow.name} (${workflow._id})`);
    console.log(`   Trigger: ${trigger.type}, Retry: ${retryCount}/${workflow.maxRetries || 3}`);

    try {
      // Create execution record
      const execution = new WorkflowExecution({
        id: executionId,
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: 'running',
        startTime: new Date().toISOString(),
        triggerData: trigger.data,
        userId: trigger.userId,
        steps: [],
        result: {},
      });

      await execution.save();

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflow, trigger, executionId);

      // Update execution record
      const durationMs = Date.now() - startTime;
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.result = result;
      await execution.save();

      this.emit('workflow-completed', {
        workflowId: workflow._id,
        executionId,
        result,
      });

      return {
        executionId,
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: 'completed',
        result,
        retryCount,
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      console.error(`❌ Agentic workflow execution failed: ${workflow.name}`, error);

      // Check if we should retry
      const maxRetries = workflow.maxRetries || 3;
      if (retryCount < maxRetries) {
        const retryDelay = workflow.retryDelayMs || 5000;
        console.log(`   Retrying in ${retryDelay}ms...`);

        // Schedule retry
        setTimeout(() => {
          this.executionQueue.push({
            workflow,
            trigger,
            retryCount: retryCount + 1,
          });
        }, retryDelay);

        // Update execution record
        try {
          const execution = await WorkflowExecution.findOne({ id: executionId });
          if (execution) {
            execution.status = 'failed';
            execution.endTime = new Date().toISOString();
            execution.error = `Failed (retrying ${retryCount + 1}/${maxRetries}): ${errorMessage}`;
            await execution.save();
          }
        } catch (err) {
          console.error('Error updating execution record:', err);
        }

        this.emit('workflow-retrying', {
          workflowId: workflow._id,
          executionId,
          retryCount: retryCount + 1,
          error: errorMessage,
        });

        return {
          executionId,
          workflowId: workflow._id,
          workflowName: workflow.name,
          status: 'retrying',
          error: errorMessage,
          retryCount: retryCount + 1,
          durationMs,
        };
      }

      // Max retries exceeded - mark as failed
      try {
        const execution = await WorkflowExecution.findOne({ id: executionId });
        if (execution) {
          execution.status = 'failed';
          execution.endTime = new Date().toISOString();
          execution.error = `Failed after ${maxRetries} retries: ${errorMessage}`;
          await execution.save();
        }
      } catch (err) {
        console.error('Error updating execution record:', err);
      }

      this.emit('workflow-failed', {
        workflowId: workflow._id,
        executionId,
        error: errorMessage,
        retryCount,
      });

      return {
        executionId,
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: 'failed',
        error: errorMessage,
        retryCount,
        durationMs,
      };
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    workflow: WorkflowDocument,
    trigger: AgenticWorkflowTrigger,
    executionId: string
  ): Promise<any> {
    const context: any = {
      triggerResult: trigger.data,
      executionId,
      userId: trigger.userId,
    };

    // If workflow has nodes (ReactFlow format), execute them
    if (workflow.nodes && workflow.nodes.length > 0) {
      return await this.executeNodes(workflow, context);
    }

    // Otherwise, execute steps (legacy format)
    if (workflow.steps && workflow.steps.length > 0) {
      return await this.executeSteps(workflow, context);
    }

    throw new Error('Workflow has no steps or nodes to execute');
  }

  /**
   * Execute workflow nodes (ReactFlow format)
   */
  private async executeNodes(workflow: WorkflowDocument, context: any): Promise<any> {
    const results: any = {};

    // Find trigger node
    const triggerNode = workflow.nodes.find((n: any) => n.type === 'trigger');
    if (!triggerNode) {
      throw new Error('No trigger node found in workflow');
    }

    // Process nodes in order based on edges
    const processed = new Set<string>();
    const queue: string[] = [triggerNode.id];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (processed.has(nodeId)) continue;

      const node = workflow.nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      processed.add(nodeId);

      // Execute node based on type
      const nodeResult = await this.executeNode(node, context, workflow);
      results[nodeId] = nodeResult;

      // Add context for template variable resolution
      if (node.type === 'ai') {
        context.aiResult = nodeResult;
      }

      // Find next nodes via edges
      const outgoingEdges = workflow.edges?.filter((e: any) => e.source === nodeId) || [];
      for (const edge of outgoingEdges) {
        if (!processed.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    return results;
  }

  /**
   * Execute a single workflow node
   */
  private async executeNode(
    node: any,
    context: any,
    workflow: WorkflowDocument
  ): Promise<any> {
    switch (node.type) {
      case 'trigger':
        return { status: 'completed', data: context.triggerResult };

      case 'ai':
        // AI processing would go here
        // For now, return mock result
        return {
          status: 'completed',
          result: {
            extracted: true,
            data: context.triggerResult,
          },
        };

      case 'automation_rule':
        // Execute automation rule node
        const { ruleId } = node.data || {};
        if (!ruleId) {
          throw new Error('Automation rule ID is required');
        }

        // Use automation engine to execute the rule
        // This is a simplified version - in production, you'd call the full automation engine
        return {
          status: 'completed',
          ruleId,
          result: 'Automation rule executed',
        };

      case 'api':
        // API call node
        // In production, this would make actual API calls
        return {
          status: 'completed',
          result: 'API call completed',
        };

      case 'end':
        return { status: 'completed', result: 'Workflow completed' };

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return { status: 'skipped', type: node.type };
    }
  }

  /**
   * Execute workflow steps (legacy format)
   */
  private async executeSteps(workflow: WorkflowDocument, context: any): Promise<any> {
    const results: any[] = [];

    for (const step of workflow.steps) {
      try {
        // Execute step based on type
        let stepResult: any;

        switch (step.type) {
          case 'ai_processing':
            // AI processing step
            stepResult = {
              status: 'completed',
              result: { extracted: true, data: context.triggerResult },
            };
            break;

          case 'api_call':
            // API call step
            stepResult = {
              status: 'completed',
              result: 'API call completed',
            };
            break;

          default:
            stepResult = { status: 'skipped', type: step.type };
        }

        results.push({
          id: step.id,
          type: step.type,
          status: 'completed',
          result: stepResult,
        });
      } catch (error: any) {
        results.push({
          id: step.id,
          type: step.type,
          status: 'failed',
          error: error.message,
        });
        throw error;
      }
    }

    return results;
  }

  /**
   * Find agentic workflows that match a trigger
   */
  public async findMatchingWorkflows(
    trigger: AgenticWorkflowTrigger
  ): Promise<WorkflowDocument[]> {
    // Connect to DB (will use existing connection if already connected)
    await connectDB();

    // Get user's access mode
    const getUser = (await import('@/lib/db/models/User')).default;
    const User = getUser();
    const user = await User.findById(trigger.userId).lean();
    
    if (!user) {
      console.warn(`User ${trigger.userId} not found`);
      return [];
    }

    const userAccessMode = (user as any).accessMode;

    // Find active agentic workflows for this user
    const workflows = await WorkflowModel.find({
      userId: trigger.userId,
      isActive: true,
      isAgentic: true,
      $or: [
        { targetAccessMode: { $size: 0 } }, // No specific access mode (applies to all)
        { targetAccessMode: userAccessMode }, // Matches user's access mode
      ],
    }).lean();

    // Filter workflows that match the trigger type
    const matching = workflows.filter((workflow) => {
      const triggerType = workflow.trigger?.type;
      return triggerType === trigger.type;
    });

    return matching.map((w) => w as WorkflowDocument);
  }

  /**
   * Process a trigger and execute matching workflows
   */
  public async processTrigger(trigger: AgenticWorkflowTrigger): Promise<void> {
    console.log(`🔔 Processing agentic workflow trigger: ${trigger.type} for user ${trigger.userId}`);

    try {
      const matchingWorkflows = await this.findMatchingWorkflows(trigger);

      if (matchingWorkflows.length === 0) {
        console.log(`   No matching agentic workflows found`);
        return;
      }

      console.log(`   Found ${matchingWorkflows.length} matching workflow(s)`);

      // Queue all matching workflows for execution
      for (const workflow of matchingWorkflows) {
        await this.queueWorkflow(workflow, trigger);
      }
    } catch (error) {
      console.error('Error processing agentic workflow trigger:', error);
      this.emit('trigger-error', { trigger, error });
    }
  }
}

// Export singleton instance
export const agenticWorkflowExecutor = new AgenticWorkflowExecutor();

