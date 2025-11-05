import { EventEmitter } from 'events';
import { automationEngine } from './automation-engine';

export interface EmailTrigger {
  id: string;
  userId: string;
  patterns: string[];
  ruleId: string;
  enabled: boolean;
  createdAt: Date;
}

export class EmailTriggerService extends EventEmitter {
  private triggers: Map<string, EmailTrigger> = new Map();

  // Add email trigger pattern
  addTrigger(trigger: Omit<EmailTrigger, 'id' | 'createdAt'>): string {
    const id = `email_trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTrigger: EmailTrigger = {
      ...trigger,
      id,
      createdAt: new Date()
    };

    this.triggers.set(id, newTrigger);
    console.log(`📧 Email trigger added: ${newTrigger.patterns.join(', ')}`);
    
    return id;
  }

  // Process incoming email
  async processEmail(email: {
    from: string;
    subject: string;
    body: string;
    userId: string;
  }): Promise<void> {
    const userTriggers = Array.from(this.triggers.values())
      .filter(trigger => trigger.userId === email.userId && trigger.enabled);

    for (const trigger of userTriggers) {
      const matches = this.checkPatterns(email, trigger.patterns);
      
      if (matches.length > 0) {
        console.log(`🎯 Email trigger matched: ${trigger.id}`);
        
        // Execute the associated automation rule
        await automationEngine.executeRule(trigger.ruleId, {
          userId: email.userId,
          triggerData: {
            email,
            matchedPatterns: matches,
            triggerId: trigger.id
          }
        });

        this.emit('triggerMatched', { trigger, email, matches });
      }
    }
  }

  // Check if email matches any patterns
  private checkPatterns(email: any, patterns: string[]): string[] {
    const matches: string[] = [];
    const searchText = `${email.subject} ${email.body}`.toLowerCase();

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.toLowerCase(), 'i');
      if (regex.test(searchText)) {
        matches.push(pattern);
      }
    }

    return matches;
  }

  // Get triggers for user
  getUserTriggers(userId: string): EmailTrigger[] {
    return Array.from(this.triggers.values())
      .filter(trigger => trigger.userId === userId);
  }

  // Delete trigger
  deleteTrigger(triggerId: string): boolean {
    return this.triggers.delete(triggerId);
  }
}

// Singleton instance
export const emailTriggerService = new EmailTriggerService();
