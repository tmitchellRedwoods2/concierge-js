import { EmailNotificationService, CalendarEventNotification } from './email-notification';
import { CalendarEvent } from '@/lib/models/CalendarEvent';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  reminderMinutes: number[]; // e.g., [15, 60, 1440] for 15 min, 1 hour, 1 day
  appointmentTypes: {
    medical: boolean;
    business: boolean;
    personal: boolean;
  };
}

export interface NotificationSchedule {
  eventId: string;
  notificationType: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancelled' | 'appointment_modified';
  scheduledTime: Date;
  sent: boolean;
  userId: string;
}

export class NotificationService {
  private emailService: EmailNotificationService;

  constructor() {
    this.emailService = new EmailNotificationService();
  }

  async scheduleAppointmentReminders(event: any, userId: string, preferences: NotificationPreferences): Promise<{ success: boolean; scheduled: number; error?: string }> {
    try {
      console.log('🔔 Scheduling appointment reminders for event:', event.title);
      
      const scheduledNotifications: NotificationSchedule[] = [];
      
      // Schedule confirmation notification
      if (preferences.email) {
        const confirmationNotification: CalendarEventNotification = {
          eventId: event._id || event.id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          location: event.location,
          attendees: event.attendees,
          reminderType: 'appointment_confirmation',
          recipientEmail: event.attendees?.[0] || 'user@example.com', // This should come from user data
          recipientName: event.attendees?.[0] || 'User',
        };

        // Send immediate confirmation
        await this.emailService.sendCalendarNotification(confirmationNotification);
        
        scheduledNotifications.push({
          eventId: event._id || event.id,
          notificationType: 'appointment_confirmation',
          scheduledTime: new Date(),
          sent: true,
          userId,
        });
      }

      // Schedule reminder notifications based on preferences
      for (const minutes of preferences.reminderMinutes) {
        const reminderTime = new Date(event.startDate);
        reminderTime.setMinutes(reminderTime.getMinutes() - minutes);

        // Only schedule if the reminder time is in the future
        if (reminderTime > new Date()) {
          const reminderNotification: CalendarEventNotification = {
            eventId: event._id || event.id,
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            location: event.location,
            attendees: event.attendees,
            reminderType: 'appointment_reminder',
            recipientEmail: event.attendees?.[0] || 'user@example.com',
            recipientName: event.attendees?.[0] || 'User',
          };

          // For now, we'll store the notification to be sent later
          // In a production system, you'd use a job queue like Bull or Agenda
          scheduledNotifications.push({
            eventId: event._id || event.id,
            notificationType: 'appointment_reminder',
            scheduledTime: reminderTime,
            sent: false,
            userId,
          });
        }
      }

      console.log(`✅ Scheduled ${scheduledNotifications.length} notifications`);
      
      return {
        success: true,
        scheduled: scheduledNotifications.length,
      };
    } catch (error) {
      console.error('❌ Failed to schedule reminders:', error);
      return {
        success: false,
        scheduled: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendAppointmentConfirmation(event: any, userId: string, recipientEmail: string, recipientName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Sending appointment confirmation:', event.title);
      
      const notification: CalendarEventNotification = {
        eventId: event._id || event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        attendees: event.attendees,
        reminderType: 'appointment_confirmation',
        recipientEmail,
        recipientName,
      };

      const result = await this.emailService.sendCalendarNotification(notification);
      
      if (result.success) {
        console.log('✅ Appointment confirmation sent');
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('❌ Failed to send confirmation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendAppointmentReminder(event: any, userId: string, recipientEmail: string, recipientName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('🔔 Sending appointment reminder:', event.title);
      
      const notification: CalendarEventNotification = {
        eventId: event._id || event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        attendees: event.attendees,
        reminderType: 'appointment_reminder',
        recipientEmail,
        recipientName,
      };

      const result = await this.emailService.sendCalendarNotification(notification);
      
      if (result.success) {
        console.log('✅ Appointment reminder sent');
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('❌ Failed to send reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendAppointmentCancellation(event: any, userId: string, recipientEmail: string, recipientName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('❌ Sending appointment cancellation:', event.title);
      
      const notification: CalendarEventNotification = {
        eventId: event._id || event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        attendees: event.attendees,
        reminderType: 'appointment_cancelled',
        recipientEmail,
        recipientName,
      };

      const result = await this.emailService.sendCalendarNotification(notification);
      
      if (result.success) {
        console.log('✅ Appointment cancellation sent');
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('❌ Failed to send cancellation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendAppointmentModification(event: any, userId: string, recipientEmail: string, recipientName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📝 Sending appointment modification:', event.title);
      
      const notification: CalendarEventNotification = {
        eventId: event._id || event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        attendees: event.attendees,
        reminderType: 'appointment_modified',
        recipientEmail,
        recipientName,
      };

      const result = await this.emailService.sendCalendarNotification(notification);
      
      if (result.success) {
        console.log('✅ Appointment modification sent');
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('❌ Failed to send modification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testEmailService(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.emailService.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
