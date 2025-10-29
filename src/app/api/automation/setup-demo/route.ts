import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automationEngine } from '@/lib/services/automation-engine';
import { emailTriggerService } from '@/lib/services/email-trigger';
import { smartScheduler } from '@/lib/services/smart-scheduler';

// POST /api/automation/setup-demo - Set up demo automation rules
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const createdRules: string[] = [];

    // 1. Daily Health Check Reminder
    const healthRuleId = await automationEngine.addRule({
      name: 'Daily Health Check Reminder',
      description: 'Sends a daily reminder to check health metrics',
      trigger: {
        type: 'schedule',
        conditions: {
          cron: '0 9 * * *' // 9 AM daily
        }
      },
      actions: [
        {
          type: 'send_email',
          config: {
            to: 'user@example.com',
            subject: 'Daily Health Check Reminder',
            template: 'health_reminder',
            data: {
              title: 'Daily Health Check',
              message: 'Time for your daily health check! Remember to track your vitals and medications.',
              recipientName: 'User'
            }
          }
        }
      ],
      enabled: true,
      userId
    });
    createdRules.push(healthRuleId);

    // 2. Medical Appointment Detection
    const appointmentRuleId = await automationEngine.addRule({
      name: 'Medical Appointment Detection',
      description: 'Automatically detects and schedules medical appointments from emails',
      trigger: {
        type: 'email',
        conditions: {
          patterns: ['appointment', 'doctor', 'medical', 'physical', 'checkup', 'annual']
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
                  title: 'Medical Appointment - Dr. Smith',
                  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour duration
                  location: '123 Medical Center, Health City',
                  description: 'Medical appointment detected from email'
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
                    doctor: 'Dr. Smith',
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    location: '123 Medical Center, Health City',
                    recipientName: 'User'
                  }
                }
              }
            ]
          }
        }
      ],
      enabled: true,
      userId
    });
    createdRules.push(appointmentRuleId);

    // 3. Meeting Follow-up Automation
    const meetingRuleId = await automationEngine.addRule({
      name: 'Meeting Follow-up',
      description: 'Sends follow-up emails after meetings end',
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
              message: 'Thank you for the productive meeting. Here are the action items we discussed.',
              recipientName: 'User'
            }
          }
        }
      ],
      enabled: true,
      userId
    });
    createdRules.push(meetingRuleId);

    // 4. Medication Reminder
    const medicationRuleId = await automationEngine.addRule({
      name: 'Medication Reminder',
      description: 'Sends medication reminders three times daily',
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
              message: 'Don\'t forget to take your scheduled medication.',
              recipientName: 'User'
            }
          }
        }
      ],
      enabled: true,
      userId
    });
    createdRules.push(medicationRuleId);

    // 5. Smart Scheduling Rule
    const schedulingRuleId = smartScheduler.addRule({
      name: 'Work Hours Scheduling',
      description: 'Prefers scheduling during work hours (9 AM - 5 PM)',
      conditions: {
        timeOfDay: { start: '09:00', end: '17:00' },
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        duration: { min: 30, max: 120 }, // 30 minutes to 2 hours
        bufferTime: 15 // 15 minutes buffer
      },
      preferences: {
        preferredTimes: ['10:00', '14:00', '15:00'],
        avoidTimes: ['12:00', '13:00'], // Avoid lunch time
        maxDailyEvents: 6
      },
      enabled: true,
      userId
    });
    createdRules.push(schedulingRuleId);

    // 6. Email Trigger for Doctor Communications
    const emailTriggerId = emailTriggerService.addTrigger({
      userId,
      patterns: ['appointment', 'doctor', 'medical', 'physical', 'checkup', 'annual', 'prescription', 'refill'],
      ruleId: appointmentRuleId,
      enabled: true
    });
    createdRules.push(emailTriggerId);

    return NextResponse.json({
      success: true,
      message: 'Demo automation rules created successfully',
      createdRules: {
        healthRuleId,
        appointmentRuleId,
        meetingRuleId,
        medicationRuleId,
        schedulingRuleId,
        emailTriggerId
      },
      count: createdRules.length
    });
  } catch (error) {
    console.error('Error setting up demo automation:', error);
    return NextResponse.json(
      { error: 'Failed to set up demo automation' },
      { status: 500 }
    );
  }
}
