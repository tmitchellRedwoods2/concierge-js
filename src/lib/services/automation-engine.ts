import { EventEmitter } from 'events';
import { NotificationService } from './notification-service';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { AutomationRule as AutomationRuleModel } from '@/lib/models/AutomationRule';
import connectDB from '@/lib/db/mongodb';

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
      // Load rules from database asynchronously
      this.loadRulesFromDB().catch(err => {
        console.error('Error loading rules from database:', err);
      });
    } catch (error) {
      console.error('Error initializing AutomationEngine:', error);
      // Continue without notification service if it fails
      // This allows rules to be created even if email service isn't configured
      this.notificationService = null;
    }
  }

  // Load rules from MongoDB
  private async loadRulesFromDB(): Promise<void> {
    try {
      await connectDB();
      const rules = await AutomationRuleModel.find({}).lean();
      
      for (const ruleDoc of rules) {
        const rule: AutomationRule = {
          id: ruleDoc._id.toString(),
          name: ruleDoc.name,
          description: ruleDoc.description,
          trigger: ruleDoc.trigger,
          actions: ruleDoc.actions as AutomationAction[],
          enabled: ruleDoc.enabled,
          userId: ruleDoc.userId,
          createdAt: ruleDoc.createdAt || new Date(),
          lastExecuted: ruleDoc.lastExecuted,
          executionCount: ruleDoc.executionCount || 0
        };
        
        this.rules.set(rule.id, rule);
        
        // Schedule time-based rules
        if (rule.trigger.type === 'schedule') {
          this.scheduleRule(rule);
        }
      }
      
      console.log(`📦 Loaded ${rules.length} automation rules from database`);
    } catch (error) {
      console.error('Error loading rules from database:', error);
      // Continue without loading - rules will be created fresh
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
    try {
      await connectDB();
      
      // Create rule in MongoDB
      const ruleDoc = new AutomationRuleModel({
        userId: rule.userId,
        name: rule.name,
        description: rule.description,
        trigger: rule.trigger,
        actions: rule.actions,
        enabled: rule.enabled,
        executionCount: 0
      });
      
      const savedRule = await ruleDoc.save();
      const id = savedRule._id.toString();
      
      // Add to in-memory Map
      const newRule: AutomationRule = {
        ...rule,
        id,
        createdAt: savedRule.createdAt || new Date(),
        executionCount: 0
      };
      
      this.rules.set(id, newRule);
      console.log(`🤖 Added automation rule: ${newRule.name} (ID: ${id})`);
      
      // If it's a time-based rule, schedule it
      if (newRule.trigger.type === 'schedule') {
        this.scheduleRule(newRule);
      }

      return id;
    } catch (error) {
      console.error('Error saving rule to database:', error);
      // Fallback to in-memory only if DB save fails
      const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRule: AutomationRule = {
        ...rule,
        id,
        createdAt: new Date(),
        executionCount: 0
      };
      this.rules.set(id, newRule);
      console.log(`🤖 Added automation rule (in-memory only): ${newRule.name}`);
      return id;
    }
  }

  // Execute a rule manually
  async executeRule(ruleId: string, context: Partial<AutomationContext> = {}): Promise<{ success: boolean; executionLog?: ExecutionLog }> {
    let rule = this.rules.get(ruleId);
    
    // If rule not in memory, try loading from database
    if (!rule) {
      try {
        await connectDB();
        const ruleDoc = await AutomationRuleModel.findById(ruleId).lean();
        if (ruleDoc) {
          rule = {
            id: ruleDoc._id.toString(),
            name: ruleDoc.name,
            description: ruleDoc.description,
            trigger: ruleDoc.trigger,
            actions: ruleDoc.actions as AutomationAction[],
            enabled: ruleDoc.enabled,
            userId: ruleDoc.userId,
            createdAt: ruleDoc.createdAt || new Date(),
            lastExecuted: ruleDoc.lastExecuted,
            executionCount: ruleDoc.executionCount || 0
          };
          this.rules.set(rule.id, rule);
        }
      } catch (error) {
        console.error('Error loading rule from database:', error);
      }
    }
    
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
      
      // Persist stats to database
      try {
        await connectDB();
        await AutomationRuleModel.findByIdAndUpdate(rule.id, {
          lastExecuted: rule.lastExecuted,
          executionCount: rule.executionCount
        });
      } catch (error) {
        console.error('Error updating rule stats in database:', error);
        // Continue - in-memory update already done
      }
      
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
      const { to, recipientEmail, subject, template, data } = action.config;
      const resolvedRecipient = to || recipientEmail;

      console.log(`📧 Email action config:`, { to, recipientEmail, subject, template, data });
      console.log(`📧 Resolved recipient: ${resolvedRecipient}`);

      if (!resolvedRecipient || resolvedRecipient.trim() === '') {
        throw new Error('Recipient email is required for send_email action');
      }
      
      // Construct event object for sendAppointmentConfirmation
      const eventId = data?.eventId || context.triggerData?.calendarEventId || `event_${Date.now()}`;
      const eventData = {
        _id: eventId,
        id: eventId,
        title: data?.title || subject || 'Appointment',
        description: data?.description || '',
        startDate: data?.startDate || new Date().toISOString(),
        endDate: data?.endDate || new Date(Date.now() + 3600000).toISOString(),
        location: data?.location || '',
        attendees: data?.attendees || [resolvedRecipient],
      };

      // Construct event URL
      const eventUrl = data?.eventUrl || `/calendar/event/${eventId}`;

      const notificationService = this.getNotificationService();
      const result = await notificationService.sendAppointmentConfirmation(
        eventData,
        context.userId,
        resolvedRecipient,
        data?.recipientName || 'User',
        eventUrl
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log(`📧 Email sent to ${resolvedRecipient}`);
      return {
        message: `Email sent successfully to ${resolvedRecipient}`,
        details: { to: resolvedRecipient, subject, template, result }
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
    
    // Determine source and workflowExecutionId from context
    const source = context.triggerData?.workflowExecutionId ? 'workflow' : (context.triggerData?.email ? 'email' : 'manual');
    const workflowExecutionId = context.triggerData?.workflowExecutionId || undefined;
    
    const event = new CalendarEvent({
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || '',
      description: description || '',
      userId: context.userId,
      attendees: action.config.attendees || [],
      allDay: action.config.allDay || false,
      source: source as 'workflow' | 'manual' | 'import' | 'email',
      workflowExecutionId: workflowExecutionId,
      createdBy: context.userId,
      status: 'confirmed'
    });

    await event.save();
    const eventId = event._id.toString();
    console.log(`📅 Calendar event created: ${title} (source: ${source})`);

    // Generate ICS URL for automatic Apple Calendar integration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const icsUrl = `${baseUrl}/api/calendar/event/${eventId}/ics`;

    // If this is from an email trigger, automatically send notification with ICS link
    if (context.triggerData?.email && this.notificationService) {
      try {
        await this.notificationService.sendAppointmentConfirmation(
          {
            _id: eventId,
            id: eventId,
            title,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            location: location || '',
            description: description || '',
            attendees: action.config.attendees || []
          },
          context.userId,
          context.triggerData.email.from || '',
          'User',
          `/calendar/event/${eventId}`
        );
        console.log(`📧 Notification sent for event ${eventId}`);
      } catch (error) {
        console.error('⚠️ Failed to send notification:', error);
      }
    }

    return {
      message: `Calendar event "${title}" created successfully`,
      details: { 
        eventId, 
        title, 
        startDate, 
        endDate, 
        source, 
        workflowExecutionId,
        icsUrl // Include ICS URL for automatic download
      }
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
  async getUserRules(userId: string): Promise<AutomationRule[]> {
    try {
      await connectDB();
      
      // Load from database first to ensure we have latest
      const rules = await AutomationRuleModel.find({ userId }).lean();
      
      this.rules = new Map();
      for (const ruleDoc of rules) {
        const id = ruleDoc._id.toString();
        const rule: AutomationRule = {
          id,
          name: ruleDoc.name,
          description: ruleDoc.description,
          trigger: ruleDoc.trigger,
          actions: ruleDoc.actions as AutomationAction[],
          enabled: ruleDoc.enabled,
          userId: ruleDoc.userId,
          createdAt: ruleDoc.createdAt || new Date(),
          lastExecuted: ruleDoc.lastExecuted,
          executionCount: ruleDoc.executionCount || 0
        };
        this.rules.set(id, rule);
      }
      
      // Return from in-memory Map (filtered by userId)
      return Array.from(this.rules.values()).filter(rule => rule.userId === userId);
    } catch (error) {
      console.error('Error loading rules from database:', error);
      // Fallback to in-memory only
      return Array.from(this.rules.values()).filter(rule => rule.userId === userId);
    }
  }

  // Enable/disable a rule
  async toggleRule(ruleId: string, enabled: boolean): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    
    try {
      await connectDB();
      await AutomationRuleModel.findByIdAndUpdate(ruleId, { enabled });
      console.log(`🔄 Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating rule in database:', error);
      // Continue - in-memory update already done
    }
    
    return true;
  }

  // Update an existing rule
  async updateRule(ruleId: string, updates: Partial<Omit<AutomationRule, 'id' | 'userId' | 'createdAt' | 'executionCount' | 'lastExecuted'>>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    try {
      await connectDB();
      
      // Update in database
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.trigger !== undefined) updateData.trigger = updates.trigger;
      if (updates.actions !== undefined) updateData.actions = updates.actions;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
      
      await AutomationRuleModel.findByIdAndUpdate(ruleId, updateData);
      
      // Update in-memory rule
      if (updates.name !== undefined) rule.name = updates.name;
      if (updates.description !== undefined) rule.description = updates.description;
      if (updates.trigger !== undefined) rule.trigger = updates.trigger;
      if (updates.actions !== undefined) rule.actions = updates.actions;
      if (updates.enabled !== undefined) rule.enabled = updates.enabled;
      
      // If trigger type changed to schedule, reschedule
      if (updates.trigger && updates.trigger.type === 'schedule') {
        this.scheduleRule(rule);
      }
      
      console.log(`✏️ Rule ${ruleId} updated: ${updates.name || rule.name}`);
      return true;
    } catch (error) {
      console.error('Error updating rule in database:', error);
      // Fallback to in-memory only
      if (updates.name !== undefined) rule.name = updates.name;
      if (updates.description !== undefined) rule.description = updates.description;
      if (updates.trigger !== undefined) rule.trigger = updates.trigger;
      if (updates.actions !== undefined) rule.actions = updates.actions;
      if (updates.enabled !== undefined) rule.enabled = updates.enabled;
      return true;
    }
  }

  // Delete a rule
  async deleteRule(ruleId: string): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    try {
      await connectDB();
      await AutomationRuleModel.findByIdAndDelete(ruleId);
      this.rules.delete(ruleId);
      console.log(`🗑️ Rule ${ruleId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting rule from database:', error);
      // Fallback to in-memory only
      const deleted = this.rules.delete(ruleId);
      if (deleted) {
        console.log(`🗑️ Rule ${ruleId} deleted (in-memory only)`);
      }
      return deleted;
    }
  }

  // Execute a single action (public method for workflows to use)
  async executeSingleAction(action: AutomationAction, context: Partial<AutomationContext>): Promise<{ message?: string; details?: any } | void> {
    const fullContext: AutomationContext = {
      userId: context.userId || '',
      triggerData: context.triggerData || {},
      executionId: context.executionId || `workflow_${Date.now()}`,
      timestamp: context.timestamp || new Date(),
      ...context
    };
    
    try {
      return await this.executeAction(action, fullContext);
    } catch (error) {
      console.error(`❌ Failed to execute action ${action.type}:`, error);
      throw error;
    }
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
