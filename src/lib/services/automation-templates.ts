import { AutomationRule } from './automation-engine';

export const automationTemplates: Record<string, Omit<AutomationRule, 'id' | 'userId' | 'createdAt' | 'executionCount'>> = {
  // Medical Appointment Templates
  'medical_appointment_reminder': {
    name: 'Medical Appointment Reminder',
    description: 'Sends reminders for medical appointments',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 9 * * *' // Daily at 9 AM
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Upcoming Medical Appointment',
          template: 'medical_reminder',
          data: {
            title: 'Medical Appointment Reminder',
            message: 'You have a medical appointment coming up. Please check your calendar for details.'
          }
        }
      }
    ],
    enabled: true
  },

  'doctor_appointment_detection': {
    name: 'Doctor Appointment Detection',
    description: 'Automatically detects and schedules doctor appointments from emails',
    trigger: {
      type: 'email',
      conditions: {
        patterns: ['appointment', 'doctor', 'medical', 'physical', 'checkup']
      }
    },
    actions: [
      {
        type: 'conditional',
        config: {
          condition: {
            type: 'contains',
            field: 'subject',
            value: 'appointment'
          },
          trueActions: [
            {
              type: 'create_calendar_event',
              config: {
                title: 'Medical Appointment - {{doctor_name}}',
                startDate: '{{appointment_date}}',
                endDate: '{{appointment_end_date}}',
                location: '{{doctor_address}}',
                description: 'Medical appointment with {{doctor_name}}'
              }
            },
            {
              type: 'send_email',
              config: {
                to: 'user@example.com',
                subject: 'Medical Appointment Scheduled',
                template: 'appointment_confirmation',
                data: {
                  title: 'Medical Appointment Confirmed',
                  doctor: '{{doctor_name}}',
                  date: '{{appointment_date}}',
                  location: '{{doctor_address}}'
                }
              }
            }
          ]
        }
      }
    ],
    enabled: true
  },

  // Business Meeting Templates
  'meeting_reminder': {
    name: 'Meeting Reminder',
    description: 'Sends reminders for business meetings',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 8 * * *' // Daily at 8 AM
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Daily Meeting Schedule',
          template: 'meeting_reminder',
          data: {
            title: 'Today\'s Meetings',
            message: 'Here are your meetings for today.'
          }
        }
      }
    ],
    enabled: true
  },

  'meeting_follow_up': {
    name: 'Meeting Follow-up',
    description: 'Sends follow-up emails after meetings',
    trigger: {
      type: 'calendar_event',
      conditions: {
        eventType: 'meeting',
        action: 'ended'
      }
    },
    actions: [
      {
        type: 'wait',
        config: {
          duration: 300000 // 5 minutes
        }
      },
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Meeting Follow-up',
          template: 'meeting_followup',
          data: {
            title: 'Meeting Follow-up',
            message: 'Thank you for the meeting. Here are the next steps.'
          }
        }
      }
    ],
    enabled: true
  },

  // Personal Life Templates
  'birthday_reminder': {
    name: 'Birthday Reminder',
    description: 'Sends birthday reminders',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 10 * * *' // Daily at 10 AM
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Birthday Reminders',
          template: 'birthday_reminder',
          data: {
            title: 'Birthday Reminders',
            message: 'Don\'t forget these upcoming birthdays!'
          }
        }
      }
    ],
    enabled: true
  },

  'travel_preparation': {
    name: 'Travel Preparation',
    description: 'Prepares for upcoming travel',
    trigger: {
      type: 'calendar_event',
      conditions: {
        eventType: 'travel',
        daysBefore: 7
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Travel Preparation Checklist',
          template: 'travel_preparation',
          data: {
            title: 'Travel Preparation',
            message: 'Your trip is coming up! Here\'s your preparation checklist.'
          }
        }
      }
    ],
    enabled: true
  },

  // Health & Wellness Templates
  'medication_reminder': {
    name: 'Medication Reminder',
    description: 'Sends medication reminders',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 8,14,20 * * *' // 8 AM, 2 PM, 8 PM daily
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Medication Reminder',
          template: 'medication_reminder',
          data: {
            title: 'Time for Your Medication',
            message: 'Don\'t forget to take your medication.'
          }
        }
      }
    ],
    enabled: true
  },

  'exercise_reminder': {
    name: 'Exercise Reminder',
    description: 'Sends exercise reminders',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 18 * * 1,3,5' // 6 PM on Mon, Wed, Fri
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Exercise Time!',
          template: 'exercise_reminder',
          data: {
            title: 'Time to Exercise',
            message: 'Your scheduled workout time is here!'
          }
        }
      }
    ],
    enabled: true
  },

  // Financial Templates
  'bill_reminder': {
    name: 'Bill Reminder',
    description: 'Sends bill payment reminders',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 9 1 * *' // 1st of every month at 9 AM
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Monthly Bill Reminder',
          template: 'bill_reminder',
          data: {
            title: 'Monthly Bills Due',
            message: 'Don\'t forget to pay your monthly bills.'
          }
        }
      }
    ],
    enabled: true
  },

  'investment_check': {
    name: 'Investment Check',
    description: 'Sends investment portfolio reminders',
    trigger: {
      type: 'schedule',
      conditions: {
        cron: '0 10 1 * *' // 1st of every month at 10 AM
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'user@example.com',
          subject: 'Monthly Investment Review',
          template: 'investment_reminder',
          data: {
            title: 'Investment Portfolio Review',
            message: 'Time to review your investment portfolio.'
          }
        }
      }
    ],
    enabled: true
  }
};

export function getTemplate(templateId: string): Omit<AutomationRule, 'id' | 'userId' | 'createdAt' | 'executionCount'> | null {
  return automationTemplates[templateId] || null;
}

export function getAllTemplates(): Array<{ id: string; template: Omit<AutomationRule, 'id' | 'userId' | 'createdAt' | 'executionCount'> }> {
  return Object.entries(automationTemplates).map(([id, template]) => ({ id, template }));
}
