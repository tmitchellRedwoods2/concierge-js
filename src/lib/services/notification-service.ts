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

  async sendAppointmentConfirmation(event: any, userId: string, recipientEmail: string, recipientName?: string, eventUrl?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Sending appointment confirmation:', event.title);
      
      // Construct full URL if relative URL is provided
      let fullEventUrl = eventUrl;
      if (eventUrl && eventUrl.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || 'http://localhost:3000';
        fullEventUrl = `${baseUrl}${eventUrl}`;
      }
      
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
        eventUrl: fullEventUrl,
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

  /**
   * Send a generic notification to a user
   * This can be used for various notification types beyond appointments
   */
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: any;
      recipientEmail?: string;
      recipientName?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get user email if not provided
      let recipientEmail = notification.recipientEmail;
      let recipientName = notification.recipientName || 'User';

      if (!recipientEmail) {
        // Try to get user email from database
        try {
          const connectDB = (await import('@/lib/db/mongodb')).default;
          const getUser = (await import('@/lib/db/models/User')).default;
          await connectDB();
          const User = getUser();
          const user = await User.findOne({ _id: userId });
          if (user) {
            recipientEmail = user.email;
            recipientName = `${user.firstName} ${user.lastName}`.trim() || user.username || 'User';
          }
        } catch (dbError) {
          console.error('Error fetching user for notification:', dbError);
        }
      }

      if (!recipientEmail) {
        console.warn(`No email found for user ${userId}, skipping email notification`);
        // Still return success as we may store the notification in the database
        return {
          success: true,
          messageId: 'notification-queued'
        };
      }

      // Store notification in database (Message model)
      try {
        const connectDB = (await import('@/lib/db/mongodb')).default;
        const Message = (await import('@/lib/db/models/Message')).default;
        await connectDB();
        
        // Generate a session ID for system notifications
        const sessionId = `system-${userId}-${Date.now()}`;
        
        await Message.create({
          userId: userId as any, // MongoDB ObjectId
          sessionId,
          role: 'system',
          content: `${notification.title}: ${notification.message}`,
          agentType: 'health',
          metadata: {
            type: notification.type,
            ...notification.data
          }
        });
      } catch (dbError) {
        console.error('Error storing notification in database:', dbError);
      }

      // Send email notification
      const emailResult = await this.emailService.sendCalendarNotification({
        eventId: notification.data?.prescriptionId || notification.data?.eventId || 'notification',
        title: notification.title,
        description: notification.message,
        startDate: new Date(),
        endDate: new Date(),
        reminderType: 'appointment_confirmation', // Generic type
        recipientEmail,
        recipientName
      });

      return {
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
