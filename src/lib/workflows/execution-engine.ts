/**
 * Workflow execution engine for autonomous AI actions
 */
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStepExecution, 
  WorkflowResult,
  EventSource,
  Intent,
  UserContext
} from './types';
import { AIWorkflowProcessor } from './ai-processor';

export class WorkflowExecutionEngine {
  private aiProcessor: AIWorkflowProcessor;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.aiProcessor = new AIWorkflowProcessor();
  }

  async executeWorkflow(
    workflow: Workflow, 
    event: EventSource, 
    intent: Intent, 
    context: UserContext
  ): Promise<WorkflowResult> {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      eventId: event.id,
      userId: event.userId,
      status: 'pending',
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        startedAt: new Date(),
        completedAt: undefined,
        retryCount: 0
      })),
      startedAt: new Date()
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      // Check if approval is required
      if (workflow.approvalRequired && intent.requiresApproval) {
        execution.status = 'awaiting_approval';
        const approvalToken = await this.requestApproval(execution, intent, context);
        
        return {
          success: false,
          requiresApproval: true,
          approvalToken,
          nextSteps: ['Awaiting user approval']
        };
      }

      // Execute workflow steps
      execution.status = 'running';
      const result = await this.executeSteps(execution, workflow, intent, context);
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;

      return {
        success: true,
        data: result,
        requiresApproval: false,
        nextSteps: ['Workflow completed successfully']
      };

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();

      return {
        success: false,
        error: execution.error,
        requiresApproval: false,
        nextSteps: ['Workflow failed - manual intervention required']
      };
    } finally {
      this.activeExecutions.set(execution.id, execution);
    }
  }

  private async executeSteps(
    execution: WorkflowExecution,
    workflow: Workflow,
    intent: Intent,
    context: UserContext
  ): Promise<any> {
    const results: any = {};

    for (const step of workflow.steps) {
      const stepExecution = execution.steps.find(s => s.stepId === step.id);
      if (!stepExecution) continue;

      try {
        stepExecution.status = 'running';
        stepExecution.startedAt = new Date();

        // Check dependencies
        const dependenciesMet = this.checkDependencies(step, results);
        if (!dependenciesMet) {
          stepExecution.status = 'skipped';
          stepExecution.completedAt = new Date();
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, intent, context, results);
        
        stepExecution.status = 'completed';
        stepExecution.completedAt = new Date();
        stepExecution.result = stepResult;
        
        results[step.id] = stepResult;

      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
        stepExecution.completedAt = new Date();

        // Handle retry logic
        if (step.retryPolicy && stepExecution.retryCount < step.retryPolicy.maxRetries) {
          stepExecution.retryCount++;
          stepExecution.status = 'pending';
          
          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, step.retryPolicy!.backoffMs * stepExecution.retryCount)
          );
          
          // Retry the step
          continue;
        }

        throw error;
      }
    }

    return results;
  }

  private async executeStep(
    step: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): Promise<any> {
    switch (step.type) {
      case 'api_call':
        return await this.executeApiCall(step, intent, context, previousResults);
      
      case 'data_update':
        return await this.executeDataUpdate(step, intent, context, previousResults);
      
      case 'notification':
        return await this.executeNotification(step, intent, context, previousResults);
      
      case 'ai_processing':
        return await this.executeAIProcessing(step, intent, context, previousResults);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeApiCall(
    step: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): Promise<any> {
    const { url, method, headers, body } = step.config;
    
    // Replace placeholders in configuration
    const processedConfig = this.replacePlaceholders(step.config, intent, context, previousResults);
    
    const response = await fetch(processedConfig.url, {
      method: processedConfig.method,
      headers: processedConfig.headers,
      body: processedConfig.body ? JSON.stringify(processedConfig.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeDataUpdate(
    step: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): Promise<any> {
    const { model, operation, data } = step.config;
    
    // This would integrate with your database models
    // For now, return a mock result
    return {
      success: true,
      operation,
      model,
      data: this.replacePlaceholders(data, intent, context, previousResults)
    };
  }

  private async executeNotification(
    step: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): Promise<any> {
    const { type, message, recipients } = step.config;
    
    // Replace placeholders in message
    const processedMessage = this.replacePlaceholders(message, intent, context, previousResults);
    
    // This would integrate with your notification system
    return {
      success: true,
      type,
      message: processedMessage,
      recipients: this.replacePlaceholders(recipients, intent, context, previousResults)
    };
  }

  private async executeAIProcessing(
    step: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): Promise<any> {
    const { prompt, agentType } = step.config;
    
    // Replace placeholders in prompt
    const processedPrompt = this.replacePlaceholders(prompt, intent, context, previousResults);
    
    // Use the existing AI system
    const response = await this.aiProcessor.analyzeEvent({
      id: `ai_step_${Date.now()}`,
      type: 'notification',
      content: processedPrompt,
      metadata: {},
      timestamp: new Date(),
      userId: context.userId,
      priority: 'medium'
    }, context);

    return response;
  }

  private checkDependencies(step: any, results: any): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every((depId: string) => {
      const depResult = results[depId];
      return depResult && depResult.success !== false;
    });
  }

  private replacePlaceholders(
    config: any,
    intent: Intent,
    context: UserContext,
    previousResults: any
  ): any {
    if (typeof config === 'string') {
      return config
        .replace(/\{intent\.(\w+)\}/g, (match, key) => intent.parameters[key] || '')
        .replace(/\{context\.(\w+)\}/g, (match, key) => context[key] || '')
        .replace(/\{result\.(\w+)\}/g, (match, key) => previousResults[key] || '');
    }

    if (typeof config === 'object' && config !== null) {
      const result: any = Array.isArray(config) ? [] : {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.replacePlaceholders(value, intent, context, previousResults);
      }
      return result;
    }

    return config;
  }

  private async requestApproval(
    execution: WorkflowExecution,
    intent: Intent,
    context: UserContext
  ): Promise<string> {
    const approvalToken = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate approval message
    const message = await this.aiProcessor.generateApprovalMessage(intent, execution.workflowId);
    
    // Store approval request (this would integrate with your database)
    // For now, just return the token
    return approvalToken;
  }

  async approveWorkflow(approvalToken: string, approved: boolean): Promise<WorkflowResult> {
    // Find execution by approval token
    const execution = Array.from(this.activeExecutions.values())
      .find(exec => exec.status === 'awaiting_approval');

    if (!execution) {
      throw new Error('Approval request not found');
    }

    if (!approved) {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      return {
        success: false,
        error: 'Workflow cancelled by user',
        requiresApproval: false
      };
    }

    // Continue with workflow execution
    execution.status = 'running';
    execution.approvedAt = new Date();
    
    // This would continue the workflow execution
    // For now, return success
    return {
      success: true,
      data: { approved: true },
      requiresApproval: false,
      nextSteps: ['Workflow approved and will continue']
    };
  }

  getExecutionStatus(executionId: string): WorkflowExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  getAllExecutions(userId: string): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values())
      .filter(exec => exec.userId === userId);
  }
}
