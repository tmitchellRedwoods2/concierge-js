import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { automationEngine } from './automation-engine';

export interface SmartSchedulingRule {
  id: string;
  userId: string;
  name: string;
  conditions: {
    timeOfDay?: { start: string; end: string };
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    eventTypes?: string[];
    duration?: { min: number; max: number };
    bufferTime?: number; // minutes before/after
  };
  preferences: {
    preferredTimes: string[];
    avoidTimes: string[];
    maxDailyEvents: number;
  };
  enabled: boolean;
}

export class SmartScheduler {
  private rules: Map<string, SmartSchedulingRule> = new Map();

  // Add smart scheduling rule
  addRule(rule: Omit<SmartSchedulingRule, 'id'>): string {
    const id = `scheduler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: SmartSchedulingRule = {
      ...rule,
      id
    };

    this.rules.set(id, newRule);
    console.log(`📅 Smart scheduling rule added: ${newRule.name}`);
    
    return id;
  }

  // Find optimal time for new event
  async findOptimalTime(
    userId: string,
    eventData: {
      title: string;
      duration: number; // minutes
      type?: string;
      preferredStartTime?: Date;
      flexible?: boolean;
    }
  ): Promise<{ startTime: Date; endTime: Date; confidence: number } | null> {
    
    const userRules = Array.from(this.rules.values())
      .filter(rule => rule.userId === userId && rule.enabled);

    if (userRules.length === 0) {
      // No smart rules, use basic scheduling
      return this.basicScheduling(eventData);
    }

    // Get existing events for the user
    const existingEvents = await CalendarEvent.find({
      userId,
      startDate: { $gte: new Date() }
    }).sort({ startDate: 1 });

    // Find best time slot
    const timeSlots = await this.generateTimeSlots(eventData, userRules, existingEvents);
    
    if (timeSlots.length === 0) {
      return null;
    }

    // Return the best time slot
    const bestSlot = timeSlots[0];
    return {
      startTime: bestSlot.startTime,
      endTime: bestSlot.endTime,
      confidence: bestSlot.score
    };
  }

  // Generate possible time slots
  private async generateTimeSlots(
    eventData: any,
    rules: SmartSchedulingRule[],
    existingEvents: any[]
  ): Promise<Array<{ startTime: Date; endTime: Date; score: number }>> {
    
    const slots: Array<{ startTime: Date; endTime: Date; score: number }> = [];
    const now = new Date();
    const startDate = eventData.preferredStartTime || now;
    
    // Look ahead 30 days
    const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Generate hourly slots
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 8; hour <= 18; hour++) { // 8 AM to 6 PM
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + (eventData.duration * 60 * 1000));
        
        // Check if slot conflicts with existing events
        if (this.hasConflict(slotStart, slotEnd, existingEvents)) {
          continue;
        }

        // Score the slot based on rules
        const score = this.scoreTimeSlot(slotStart, slotEnd, rules, eventData);
        
        if (score > 0) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            score
          });
        }
      }
    }

    // Sort by score (highest first)
    return slots.sort((a, b) => b.score - a.score);
  }

  // Check for conflicts with existing events
  private hasConflict(startTime: Date, endTime: Date, existingEvents: any[]): boolean {
    return existingEvents.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (startTime < eventEnd && endTime > eventStart);
    });
  }

  // Score a time slot based on rules
  private scoreTimeSlot(
    startTime: Date,
    endTime: Date,
    rules: SmartSchedulingRule[],
    eventData: any
  ): number {
    let score = 0;
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();

    for (const rule of rules) {
      let ruleScore = 0;

      // Check time of day preference
      if (rule.conditions.timeOfDay) {
        const { start, end } = rule.conditions.timeOfDay;
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        
        if (hour >= startHour && hour < endHour) {
          ruleScore += 10;
        }
      }

      // Check days of week
      if (rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.includes(dayOfWeek)) {
        ruleScore += 5;
      }

      // Check event type
      if (rule.conditions.eventTypes && eventData.type) {
        if (rule.conditions.eventTypes.includes(eventData.type)) {
          ruleScore += 8;
        }
      }

      // Check duration constraints
      if (rule.conditions.duration) {
        const { min, max } = rule.conditions.duration;
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        if (duration >= min && duration <= max) {
          ruleScore += 5;
        }
      }

      // Check preferred times
      if (rule.preferences.preferredTimes) {
        const timeStr = startTime.toTimeString().substring(0, 5);
        if (rule.preferences.preferredTimes.includes(timeStr)) {
          ruleScore += 15;
        }
      }

      // Check avoid times
      if (rule.preferences.avoidTimes) {
        const timeStr = startTime.toTimeString().substring(0, 5);
        if (rule.preferences.avoidTimes.includes(timeStr)) {
          ruleScore -= 20;
        }
      }

      score += ruleScore;
    }

    return Math.max(0, score);
  }

  // Basic scheduling fallback
  private basicScheduling(eventData: any): { startTime: Date; endTime: Date; confidence: number } {
    const startTime = eventData.preferredStartTime || new Date();
    const endTime = new Date(startTime.getTime() + (eventData.duration * 60 * 1000));
    
    return {
      startTime,
      endTime,
      confidence: 0.5
    };
  }

  // Auto-schedule event using smart rules
  async autoScheduleEvent(
    userId: string,
    eventData: {
      title: string;
      duration: number;
      type?: string;
      description?: string;
      location?: string;
    }
  ): Promise<CalendarEvent | null> {
    
    const optimalTime = await this.findOptimalTime(userId, eventData);
    
    if (!optimalTime) {
      console.log('❌ No optimal time found for event');
      return null;
    }

    // Create the calendar event
    const event = new CalendarEvent({
      title: eventData.title,
      startDate: optimalTime.startTime,
      endDate: optimalTime.endTime,
      description: eventData.description || '',
      location: eventData.location || '',
      userId,
      attendees: [],
      allDay: false
    });

    await event.save();
    console.log(`📅 Event auto-scheduled: ${eventData.title} at ${optimalTime.startTime}`);

    // Trigger automation for newly scheduled event
    await automationEngine.executeRule('auto_schedule_notification', {
      userId,
      triggerData: {
        event,
        schedulingConfidence: optimalTime.confidence
      }
    });

    return event;
  }

  // Get user's scheduling rules
  getUserRules(userId: string): SmartSchedulingRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.userId === userId);
  }
}

// Singleton instance
export const smartScheduler = new SmartScheduler();
