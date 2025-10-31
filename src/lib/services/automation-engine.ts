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

export class AutomationEngine extends EventEmitter {
  private rules: Map<string, AutomationRule> = new Map();
  private notificationService: NotificationService;
  private isRunning: boolean = false;
  private executionQueue: Array<{ rule: AutomationRule; context: AutomationContext }> = [];

  constructor() {
    super();
    this.notificationService = new NotificationService();
    this.startExecutionLoop();
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
  async executeRule(ruleId: string, context: Partial<AutomationContext> = {}): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      console.log(`❌ Rule ${ruleId} not found or disabled`);
      return false;
    }

    const executionContext: AutomationContext = {
      userId: rule.userId,
      triggerData: context.triggerData || {},
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...context
    };

    try {
      console.log(`🚀 Executing rule: ${rule.name}`);
      await this.executeActions(rule.actions, executionContext);
      
      // Update rule stats
      rule.lastExecuted = new Date();
      rule.executionCount++;
      
      this.emit('ruleExecuted', { rule, context: executionContext });
      return true;
    } catch (error) {
      console.error(`❌ Rule execution failed: ${rule.name}`, error);
      this.emit('ruleFailed', { rule, context: executionContext, error });
      return false;
    }
  }

  // Execute multiple actions in sequence
  private async executeActions(actions: AutomationAction[], context: AutomationContext): Promise<void> {
    for (const action of actions) {
      try {
        console.log(`⚡ Executing action: ${action.type}`);
        
        // Add delay if specified
        if (action.delay) {
          await this.delay(action.delay);
        }

        await this.executeAction(action, context);
      } catch (error) {
        console.error(`❌ Action failed: ${action.type}`, error);
        throw error;
      }
    }
  }

  // Execute a single action
  private async executeAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendEmailAction(action, context);
        break;
      case 'send_sms':
        await this.sendSMSAction(action, context);
        break;
      case 'create_calendar_event':
        await this.createCalendarEventAction(action, context);
        break;
      case 'update_calendar_event':
        await this.updateCalendarEventAction(action, context);
        break;
      case 'webhook_call':
        await this.webhookCallAction(action, context);
        break;
      case 'wait':
        await this.waitAction(action, context);
        break;
      case 'conditional':
        await this.conditionalAction(action, context);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Email action
  private async sendEmailAction(action: AutomationAction, context: AutomationContext): Promise<void> {
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

    await this.notificationService.sendAppointmentConfirmation(emailData);
    console.log(`📧 Email sent to ${to}`);
  }

  // SMS action
  private async sendSMSAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    const { to, message } = action.config;
    
    // Note: SMS service would need to be implemented
    console.log(`📱 SMS would be sent to ${to}: ${message}`);
  }

  // Create calendar event action
  private async createCalendarEventAction(action: AutomationAction, context: AutomationContext): Promise<void> {
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
  }

  // Update calendar event action
  private async updateCalendarEventAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    const { eventId, updates } = action.config;
    
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      throw new Error(`Calendar event ${eventId} not found`);
    }

    Object.assign(event, updates);
    await event.save();
    console.log(`📅 Calendar event updated: ${eventId}`);
  }

  // Webhook call action
  private async webhookCallAction(action: AutomationAction, context: AutomationContext): Promise<void> {
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

    console.log(`🔗 Webhook called: ${url}`);
  }

  // Wait action
  private async waitAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    const { duration } = action.config;
    await this.delay(duration);
    console.log(`⏳ Waited for ${duration}ms`);
  }

  // Conditional action
  private async conditionalAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    const { condition, trueActions, falseActions } = action.config;
    
    const conditionMet = this.evaluateCondition(condition, context);
    const actionsToExecute = conditionMet ? trueActions : falseActions;
    
    if (actionsToExecute && actionsToExecute.length > 0) {
      await this.executeActions(actionsToExecute, context);
    }
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

// Singleton instance
export const automationEngine = new AutomationEngine();
