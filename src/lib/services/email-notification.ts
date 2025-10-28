import * as nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface CalendarEventNotification {
  eventId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  reminderType: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancelled' | 'appointment_modified';
  recipientEmail: string;
  recipientName?: string;
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    // Use environment variables or provided config
    this.config = config || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransporter(this.config);
  }

  async sendCalendarNotification(notification: CalendarEventNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Sending calendar notification:', notification.title);
      
      const template = this.getEmailTemplate(notification.reminderType, notification);
      
      const mailOptions = {
        from: `"Concierge AI" <${this.config.auth.user}>`,
        to: notification.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getEmailTemplate(type: string, notification: CalendarEventNotification): EmailTemplate {
    const { title, startDate, endDate, location, description } = notification;
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    switch (type) {
      case 'appointment_reminder':
        return {
          subject: `🔔 Reminder: ${title} - ${startTime}`,
          html: this.getReminderEmailHTML(title, startDate, endDate, location, description),
          text: this.getReminderEmailText(title, startDate, endDate, location, description),
        };

      case 'appointment_confirmation':
        return {
          subject: `✅ Confirmed: ${title} - ${startTime}`,
          html: this.getConfirmationEmailHTML(title, startDate, endDate, location, description),
          text: this.getConfirmationEmailText(title, startDate, endDate, location, description),
        };

      case 'appointment_cancelled':
        return {
          subject: `❌ Cancelled: ${title} - ${startTime}`,
          html: this.getCancellationEmailHTML(title, startDate, endDate, location, description),
          text: this.getCancellationEmailText(title, startDate, endDate, location, description),
        };

      case 'appointment_modified':
        return {
          subject: `📝 Updated: ${title} - ${startTime}`,
          html: this.getModificationEmailHTML(title, startDate, endDate, location, description),
          text: this.getModificationEmailText(title, startDate, endDate, location, description),
        };

      default:
        return {
          subject: `📅 Calendar Event: ${title}`,
          html: this.getDefaultEmailHTML(title, startDate, endDate, location, description),
          text: this.getDefaultEmailText(title, startDate, endDate, location, description),
        };
    }
  }

  private getReminderEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .event-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .time { color: #007bff; font-weight: bold; }
          .location { color: #6c757d; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Appointment Reminder</h1>
            <p>This is a friendly reminder about your upcoming appointment.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This reminder was sent by your Concierge AI assistant.</p>
            <p>If you need to make changes, please contact us or use the calendar app.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getReminderEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
APPOINTMENT REMINDER

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}

This reminder was sent by your Concierge AI assistant.
If you need to make changes, please contact us or use the calendar app.
    `.trim();
  }

  private getConfirmationEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .event-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .time { color: #007bff; font-weight: bold; }
          .location { color: #6c757d; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
            <p>Your appointment has been successfully scheduled.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This confirmation was sent by your Concierge AI assistant.</p>
            <p>You will receive a reminder before your appointment.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getConfirmationEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
APPOINTMENT CONFIRMED

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}

This confirmation was sent by your Concierge AI assistant.
You will receive a reminder before your appointment.
    `.trim();
  }

  private getCancellationEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .event-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .time { color: #dc3545; font-weight: bold; }
          .location { color: #6c757d; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
            <p>Your appointment has been cancelled.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This cancellation notice was sent by your Concierge AI assistant.</p>
            <p>If you need to reschedule, please contact us.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getCancellationEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
APPOINTMENT CANCELLED

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}

This cancellation notice was sent by your Concierge AI assistant.
If you need to reschedule, please contact us.
    `.trim();
  }

  private getModificationEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .event-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .time { color: #856404; font-weight: bold; }
          .location { color: #6c757d; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Appointment Updated</h1>
            <p>Your appointment details have been modified.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This update was sent by your Concierge AI assistant.</p>
            <p>Please review the new details and contact us if you have any questions.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getModificationEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
APPOINTMENT UPDATED

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}

This update was sent by your Concierge AI assistant.
Please review the new details and contact us if you have any questions.
    `.trim();
  }

  private getDefaultEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Calendar Event</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .event-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .time { color: #007bff; font-weight: bold; }
          .location { color: #6c757d; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Calendar Event</h1>
            <p>You have a new calendar event.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This notification was sent by your Concierge AI assistant.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDefaultEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `
CALENDAR EVENT

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}

This notification was sent by your Concierge AI assistant.
    `.trim();
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP connection failed',
      };
    }
  }
}
