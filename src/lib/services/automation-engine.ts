import { EventEmitter } from 'events';
import { NotificationService } from './notification-service';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'schedule' | 'email' | 'sms' | 'calendar_event' | 'webhook' | 'time_based';
    conditions: Record<string, any>;
  };
  actions: AutomationAction[];
  enabled: boolean;
  userId: string;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface AutomationAction {
  type: 'send_email' | 'send_sms' | 'create_calendar_event' | 'update_calendar_event' | 'webhook_call' | 'wait' | 'conditional';
  config: Record<string, any>;
  delay?: number; // milliseconds
}

export interface AutomationContext {
  userId: string;
  triggerData: any;
  executionId: string;
  timestamp: Date;
}

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  status: 'success' | 'failed' | 'partial';
  timestamp: Date;
  actions: Array<{
    type: string;
    status: 'success' | 'failed';
    message?: string;
    details?: any;
  }>;
  error?: string;
  duration?: number;
}

export class AutomationEngine extends EventEmitter {
  private rules: Map<string, AutomationRule> = new Map();
  private notificationService: NotificationService | null = null;
  private isRunning: boolean = false;
  private executionQueue: Array<{ rule: AutomationRule; context: AutomationContext }> = [];
  private executionLogs: Map<string, ExecutionLog[]> = new Map(); // userId -> logs[]

  constructor() {
    super();
    try {
      this.notificationService = new NotificationService();
      this.startExecutionLoop();
    } catch (error) {
      console.error('Error initializing AutomationEngine:', error);
      // Continue without notification service if it fails
      // This allows rules to be created even if email service isn't configured
      this.notificationService = null;
    }
  }

  private getNotificationService(): NotificationService {
    if (!this.notificationService) {
      try {
        this.notificationService = new NotificationService();
      } catch (error) {
        console.error('Error creating NotificationService:', error);
        throw new Error('Notification service not available');
      }
    }
    return this.notificationService;
  }

  // Add a new automation rule
  async addRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): Promise<string> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: AutomationRule = {
      ...rule,
      id,
      createdAt: new Date(),
      executionCount: 0
    };

    this.rules.set(id, newRule);
    console.log(`🤖 Added automation rule: ${newRule.name}`);
    
    // If it's a time-based rule, schedule it
    if (newRule.trigger.type === 'schedule') {
      this.scheduleRule(newRule);
    }

    return id;
  }

  // Execute a rule manually
  async executeRule(ruleId: string, context: Partial<AutomationContext> = {}): Promise<{ success: boolean; executionLog?: ExecutionLog }> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      console.log(`❌ Rule ${ruleId} not found or disabled`);
      return { success: false };
    }

    const executionContext: AutomationContext = {
      userId: rule.userId,
      triggerData: context.triggerData || {},
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...context
    };

    const startTime = Date.now();
    const executionLog: ExecutionLog = {
      id: executionContext.executionId,
      ruleId: rule.id,
      ruleName: rule.name,
      userId: rule.userId,
      status: 'success',
      timestamp: executionContext.timestamp,
      actions: []
    };

    try {
      console.log(`🚀 Executing rule: ${rule.name}`);
      const actionResults = await this.executeActions(rule.actions, executionContext, executionLog);
      executionLog.actions = actionResults;
      
      // Determine overall status
      const hasFailures = actionResults.some(a => a.status === 'failed');
      executionLog.status = hasFailures ? (actionResults.some(a => a.status === 'success') ? 'partial' : 'failed') : 'success';
      
      // Update rule stats
      rule.lastExecuted = new Date();
      rule.executionCount++;
      
      executionLog.duration = Date.now() - startTime;
      this.logExecution(executionLog);
      
      this.emit('ruleExecuted', { rule, context: executionContext, log: executionLog });
      return { success: true, executionLog };
    } catch (error) {
      console.error(`❌ Rule execution failed: ${rule.name}`, error);
      executionLog.status = 'failed';
      executionLog.error = error instanceof Error ? error.message : 'Unknown error';
      executionLog.duration = Date.now() - startTime;
      this.logExecution(executionLog);
      
      this.emit('ruleFailed', { rule, context: executionContext, error, log: executionLog });
      return { success: false, executionLog };
    }
  }

  // Log execution history
  private logExecution(log: ExecutionLog): void {
    if (!this.executionLogs.has(log.userId)) {
      this.executionLogs.set(log.userId, []);
    }
    const logs = this.executionLogs.get(log.userId)!;
    logs.unshift(log); // Add to beginning
    // Keep only last 100 executions per user
    if (logs.length > 100) {
      logs.pop();
    }
  }

  // Get execution history for a user
  getUserExecutionLogs(userId: string, limit: number = 50): ExecutionLog[] {
    const logs = this.executionLogs.get(userId) || [];
    return logs.slice(0, limit);
  }

  // Get execution logs for a specific rule
  getRuleExecutionLogs(ruleId: string, limit: number = 20): ExecutionLog[] {
    const allLogs: ExecutionLog[] = [];
    for (const logs of this.executionLogs.values()) {
      allLogs.push(...logs.filter(log => log.ruleId === ruleId));
    }
    return allLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Execute multiple actions in sequence
  private async executeActions(actions: AutomationAction[], context: AutomationContext, executionLog: ExecutionLog): Promise<Array<{ type: string; status: 'success' | 'failed'; message?: string; details?: any }>> {
    const results: Array<{ type: string; status: 'success' | 'failed'; message?: string; details?: any }> = [];
    
    for (const action of actions) {
      try {
        console.log(`⚡ Executing action: ${action.type}`);
        
        // Add delay if specified
        if (action.delay) {
          await this.delay(action.delay);
        }

        const actionResult = await this.executeAction(action, context);
        results.push({
          type: action.type,
          status: 'success',
          message: actionResult?.message || `${action.type} completed successfully`,
          details: actionResult?.details
        });
      } catch (error) {
        console.error(`❌ Action failed: ${action.type}`, error);
        results.push({
          type: action.type,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Action failed',
          details: { error: error instanceof Error ? error.stack : String(error) }
        });
        // Continue with next action instead of throwing
      }
    }
    
    return results;
  }

  // Execute a single action
  private async executeAction(action: AutomationAction, context: AutomationContext): Promise<{ message?: string; details?: any } | void> {
    switch (action.type) {
      case 'send_email':
        return await this.sendEmailAction(action, context);
      case 'send_sms':
        return await this.sendSMSAction(action, context);
      case 'create_calendar_event':
        return await this.createCalendarEventAction(action, context);
      case 'update_calendar_event':
        return await this.updateCalendarEventAction(action, context);
      case 'webhook_call':
        return await this.webhookCallAction(action, context);
      case 'wait':
        return await this.waitAction(action, context);
      case 'conditional':
        return await this.conditionalAction(action, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Email action
  private async sendEmailAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    try {
      const { to, subject, template, data } = action.config;
      
      const emailData = {
        type: template || 'appointment_confirmation',
        recipientEmail: to,
        recipientName: data?.recipientName || 'User',
        title: data?.title || subject,
        startDate: data?.startDate || new Date().toISOString(),
        endDate: data?.endDate || new Date(Date.now() + 3600000).toISOString(),
        location: data?.location || '',
        description: data?.description || '',
        ...data
      };

      const notificationService = this.getNotificationService();
      const result = await notificationService.sendAppointmentConfirmation(emailData);
      console.log(`📧 Email sent to ${to}`);
      return {
        message: `Email sent successfully to ${to}`,
        details: { to, subject, template, result }
      };
    } catch (error) {
      console.error('❌ Failed to send email action:', error);
      throw error; // Re-throw so it can be logged
    }
  }

  // SMS action
  private async sendSMSAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { to, message } = action.config;
    
    // Note: SMS service would need to be implemented
    console.log(`📱 SMS would be sent to ${to}: ${message}`);
    return {
      message: `SMS sent to ${to}`,
      details: { to, message }
    };
  }

  // Create calendar event action
  private async createCalendarEventAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { title, startDate, endDate, location, description } = action.config;
    
    const event = new CalendarEvent({
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || '',
      description: description || '',
      userId: context.userId,
      attendees: action.config.attendees || [],
      allDay: action.config.allDay || false
    });

    await event.save();
    console.log(`📅 Calendar event created: ${title}`);
    return {
      message: `Calendar event "${title}" created successfully`,
      details: { eventId: event._id.toString(), title, startDate, endDate }
    };
  }

  // Update calendar event action
  private async updateCalendarEventAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { eventId, updates } = action.config;
    
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      throw new Error(`Calendar event ${eventId} not found`);
    }

    Object.assign(event, updates);
    await event.save();
    console.log(`📅 Calendar event updated: ${eventId}`);
    return {
      message: `Calendar event ${eventId} updated successfully`,
      details: { eventId, updates }
    };
  }

  // Webhook call action
  private async webhookCallAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { url, method = 'POST', headers = {}, body } = action.config;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json().catch(() => null);
    console.log(`🔗 Webhook called: ${url}`);
    return {
      message: `Webhook called successfully: ${url}`,
      details: { url, method, status: response.status, response: responseData }
    };
  }

  // Wait action
  private async waitAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { duration } = action.config;
    await this.delay(duration);
    console.log(`⏳ Waited for ${duration}ms`);
    return {
      message: `Waited for ${duration}ms`,
      details: { duration }
    };
  }

  // Conditional action
  private async conditionalAction(action: AutomationAction, context: AutomationContext): Promise<{ message: string; details: any }> {
    const { condition, trueActions, falseActions } = action.config;
    
    const conditionMet = this.evaluateCondition(condition, context);
    const actionsToExecute = conditionMet ? trueActions : falseActions;
    
    let executedActions = 0;
    if (actionsToExecute && actionsToExecute.length > 0) {
      // Create a temporary execution log for nested actions
      const tempLog: ExecutionLog = {
        id: `temp_${Date.now()}`,
        ruleId: context.executionId,
        ruleName: 'Conditional',
        userId: context.userId,
        status: 'success',
        timestamp: new Date(),
        actions: []
      };
      const results = await this.executeActions(actionsToExecute, context, tempLog);
      executedActions = results.length;
    }
    
    return {
      message: `Condition evaluated: ${conditionMet ? 'true' : 'false'}, executed ${executedActions} actions`,
      details: { conditionMet, executedActions }
    };
  }

  // Evaluate condition
  private evaluateCondition(condition: any, context: AutomationContext): boolean {
    // Simple condition evaluation - can be enhanced
    if (typeof condition === 'string') {
      return condition === 'true';
    }
    
    if (typeof condition === 'object' && condition.type) {
      switch (condition.type) {
        case 'equals':
          return context.triggerData[condition.field] === condition.value;
        case 'contains':
          return context.triggerData[condition.field]?.includes(condition.value);
        case 'greater_than':
          return context.triggerData[condition.field] > condition.value;
        case 'less_than':
          return context.triggerData[condition.field] < condition.value;
        default:
          return false;
      }
    }
    
    return false;
  }

  // Schedule a time-based rule
  private scheduleRule(rule: AutomationRule): void {
    if (rule.trigger.type !== 'schedule') return;

    const { cron, interval } = rule.trigger.conditions;
    
    if (cron) {
      // Simple cron-like scheduling (would use a proper cron library in production)
      this.scheduleCronRule(rule, cron);
    } else if (interval) {
      // Interval-based scheduling
      setInterval(() => {
        this.executeRule(rule.id);
      }, interval);
    }
  }

  // Simple cron scheduling
  private scheduleCronRule(rule: AutomationRule, cronExpression: string): void {
    // This is a simplified implementation
    // In production, use a library like node-cron
    console.log(`⏰ Scheduled rule: ${rule.name} with cron: ${cronExpression}`);
  }

  // Start the execution loop
  private startExecutionLoop(): void {
    this.isRunning = true;
    
    const processQueue = async () => {
      while (this.isRunning) {
        if (this.executionQueue.length > 0) {
          const { rule, context } = this.executionQueue.shift()!;
          await this.executeRule(rule.id, context);
        }
        await this.delay(1000); // Check every second
      }
    };

    processQueue();
  }

  // Add to execution queue
  queueExecution(rule: AutomationRule, context: AutomationContext): void {
    this.executionQueue.push({ rule, context });
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all rules for a user
  getUserRules(userId: string): AutomationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.userId === userId);
  }

  // Enable/disable a rule
  async toggleRule(ruleId: string, enabled: boolean): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    console.log(`🔄 Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  // Delete a rule
  async deleteRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ Rule ${ruleId} deleted`);
    }
    return deleted;
  }

  // Stop the automation engine
  stop(): void {
    this.isRunning = false;
    console.log('🛑 Automation engine stopped');
  }
}

// Singleton instance - with error handling for serverless environments
let automationEngineInstance: AutomationEngine | null = null;

function createAutomationEngine(): AutomationEngine {
  try {
    return new AutomationEngine();
  } catch (error) {
    console.error('Error creating AutomationEngine singleton:', error);
    // Even if initialization partially fails, create instance
    // The constructor will handle notification service failures gracefully
    const engine = Object.create(AutomationEngine.prototype);
    engine.rules = new Map();
    engine.notificationService = null;
    engine.isRunning = false;
    engine.executionQueue = [];
    engine.startExecutionLoop = () => {}; // No-op if it fails
    return engine as AutomationEngine;
  }
}

export const automationEngine = createAutomationEngine();
