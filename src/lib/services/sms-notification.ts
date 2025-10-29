import twilio from 'twilio';

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SMSNotification {
  eventId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminderType: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancelled' | 'appointment_modified';
  recipientPhone: string;
  recipientName?: string;
}

export class SMSNotificationService {
  private client: twilio.Twilio;
  private config: SMSConfig;

  constructor(config?: SMSConfig) {
    // Use environment variables or provided config
    this.config = config || {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };

    if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
      throw new Error('Twilio configuration is incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
    }

    this.client = twilio(this.config.accountSid, this.config.authToken);
  }

  async sendCalendarNotification(notification: SMSNotification): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    try {
      console.log('📱 Sending SMS notification:', notification.title);
      
      const message = this.formatSMSMessage(notification);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: this.formatPhoneNumber(notification.recipientPhone),
      });
      
      console.log('✅ SMS sent successfully:', result.sid);
      
      return {
        success: true,
        messageSid: result.sid,
      };
    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatSMSMessage(notification: SMSNotification): string {
    const { title, startDate, endDate, location, description, reminderType, recipientName } = notification;
    
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const greeting = recipientName ? `Hi ${recipientName}!` : 'Hello!';
    
    switch (reminderType) {
      case 'appointment_confirmation':
        return `${greeting} ✅ Your appointment "${title}" is confirmed for ${startTime}.${location ? ` Location: ${location}` : ''}${description ? ` Details: ${description}` : ''} - Concierge AI`;

      case 'appointment_reminder':
        return `${greeting} 🔔 Reminder: Your appointment "${title}" is coming up at ${startTime}.${location ? ` Location: ${location}` : ''}${description ? ` Details: ${description}` : ''} - Concierge AI`;

      case 'appointment_cancelled':
        return `${greeting} ❌ Your appointment "${title}" scheduled for ${startTime} has been cancelled.${description ? ` Reason: ${description}` : ''} Please contact us to reschedule. - Concierge AI`;

      case 'appointment_modified':
        return `${greeting} 📝 Your appointment "${title}" has been updated to ${startTime}.${location ? ` New location: ${location}` : ''}${description ? ` Details: ${description}` : ''} - Concierge AI`;

      default:
        return `${greeting} 📅 Calendar Event: "${title}" on ${startTime}.${location ? ` Location: ${location}` : ''}${description ? ` Details: ${description}` : ''} - Concierge AI`;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, it's already formatted
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's 10 digits, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add +1
    return `+1${cleaned}`;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test by getting account info
      const account = await this.client.api.accounts(this.config.accountSid).fetch();
      console.log('✅ Twilio connection verified for account:', account.friendlyName);
      return { success: true };
    } catch (error) {
      console.error('❌ Twilio connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio connection failed',
      };
    }
  }

  async sendTestSMS(recipientPhone: string, recipientName?: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    const testNotification: SMSNotification = {
      eventId: 'test-' + Date.now(),
      title: 'Test Appointment - Doctor Visit',
      description: 'This is a test appointment to verify SMS notifications are working correctly.',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      location: '123 Main St, City, State 12345',
      reminderType: 'appointment_confirmation',
      recipientPhone,
      recipientName: recipientName || 'Test User',
    };

    return this.sendCalendarNotification(testNotification);
  }
}
