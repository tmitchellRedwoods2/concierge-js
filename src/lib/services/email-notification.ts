const nodemailer = require('nodemailer');

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
  eventUrl?: string; // URL to view the calendar event
}

export interface PrescriptionRefillNotification {
  prescriptionId: string;
  medicationName: string;
  dosage?: string;
  pharmacy: string;
  orderNumber?: string;
  estimatedReadyDate?: Date;
  refillByDate?: Date;
  refillType: 'refill_requested' | 'refill_available' | 'refill_ready';
  recipientEmail: string;
  recipientName?: string;
  prescriptionUrl?: string; // URL to view prescription details
  autoRefillEnabled?: boolean;
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

    try {
      this.transporter = nodemailer.createTransport(this.config);
    } catch (error) {
      console.error('Error creating email transporter:', error);
      // Create a minimal transporter that will fail gracefully later
      // This allows the service to be created even if config is incomplete
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      });
    }
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

  async sendPrescriptionRefillNotification(notification: PrescriptionRefillNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Sending prescription refill notification:', notification.medicationName);
      
      const template = this.getPrescriptionRefillTemplate(notification);
      
      const mailOptions = {
        from: `"Concierge AI" <${this.config.auth.user}>`,
        to: notification.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Prescription refill notification sent:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ Prescription refill notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getEmailTemplate(type: string, notification: CalendarEventNotification): EmailTemplate {
    const { title, startDate, endDate, location, description, eventUrl } = notification;
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
          html: this.getConfirmationEmailHTML(title, startDate, endDate, location, description, eventUrl, notification.eventId),
          text: this.getConfirmationEmailText(title, startDate, endDate, location, description, eventUrl, notification.eventId),
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

  private getConfirmationEmailHTML(title: string, startDate: Date, endDate: Date, location?: string, description?: string, eventUrl?: string, eventId?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // Generate ICS download URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const icsUrl = eventId ? `${baseUrl}/api/calendar/event/${eventId}/ics` : null;

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
          .button-group { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; margin: 5px; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .button-primary { background: #007bff; }
          .button-success { background: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
            <p>Your appointment has been automatically added to your calendar.</p>
          </div>
          
          <div class="event-details">
            <h2>${title}</h2>
            <p class="time">📅 ${startTime}</p>
            ${location ? `<p class="location">📍 ${location}</p>` : ''}
            ${description ? `<p>${description}</p>` : ''}
            <div class="button-group">
              ${icsUrl ? `
                <a href="${icsUrl}" class="button button-success" style="background: #28a745; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                  📅 Add to Apple Calendar
                </a>
              ` : ''}
              ${eventUrl ? `
                <a href="${eventUrl}" class="button button-primary" style="background: #007bff; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                  View Event Details
                </a>
              ` : ''}
            </div>
            ${icsUrl ? `
              <p style="text-align: center; margin-top: 10px; font-size: 12px; color: #6c757d;">
                💡 <strong>Tip:</strong> Click "Add to Apple Calendar" to automatically add this event to your Calendar.app. 
                On macOS, the event will open automatically in Calendar.
              </p>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This confirmation was automatically sent by your Concierge AI assistant.</p>
            <p>You will receive a reminder before your appointment.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getConfirmationEmailText(title: string, startDate: Date, endDate: Date, location?: string, description?: string, eventUrl?: string, eventId?: string): string {
    const startTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const icsUrl = eventId ? `${baseUrl}/api/calendar/event/${eventId}/ics` : null;

    return `
APPOINTMENT CONFIRMED

${title}
📅 ${startTime}
${location ? `📍 ${location}` : ''}
${description ? `\n${description}` : ''}
${icsUrl ? `\n\n📅 Add to Apple Calendar: ${icsUrl}` : ''}
${eventUrl ? `\n\nView Calendar Event: ${eventUrl}` : ''}

This confirmation was automatically sent by your Concierge AI assistant.
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

  /**
   * Get prescription refill email template
   */
  private getPrescriptionRefillTemplate(notification: PrescriptionRefillNotification): EmailTemplate {
    const { medicationName, dosage, pharmacy, orderNumber, estimatedReadyDate, refillType, prescriptionUrl, autoRefillEnabled } = notification;

    switch (refillType) {
      case 'refill_requested':
        return {
          subject: `✅ Prescription Refill Requested: ${medicationName}`,
          html: this.getRefillRequestedHTML(notification),
          text: this.getRefillRequestedText(notification),
        };

      case 'refill_available':
        return {
          subject: `💊 Prescription Refill Available: ${medicationName}`,
          html: this.getRefillAvailableHTML(notification),
          text: this.getRefillAvailableText(notification),
        };

      case 'refill_ready':
        return {
          subject: `📦 Prescription Ready for Pickup: ${medicationName}`,
          html: this.getRefillReadyHTML(notification),
          text: this.getRefillReadyText(notification),
        };

      default:
        return {
          subject: `💊 Prescription Update: ${medicationName}`,
          html: this.getRefillAvailableHTML(notification),
          text: this.getRefillAvailableText(notification),
        };
    }
  }

  private getRefillRequestedHTML(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber, estimatedReadyDate, prescriptionUrl, autoRefillEnabled } = notification;
    const readyDate = estimatedReadyDate 
      ? estimatedReadyDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Next business day';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prescription Refill Requested</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .medication { font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .info { margin: 10px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Prescription Refill Requested</h1>
            <p>Your refill request has been submitted successfully.</p>
          </div>
          
          <div class="details">
            <div class="medication">💊 ${medicationName}${dosage ? ` (${dosage})` : ''}</div>
            <div class="info"><strong>Pharmacy:</strong> ${pharmacy}</div>
            ${orderNumber ? `<div class="info"><strong>Order Number:</strong> ${orderNumber}</div>` : ''}
            <div class="info"><strong>Estimated Ready Date:</strong> ${readyDate}</div>
            ${autoRefillEnabled ? '<div class="info" style="color: #28a745;"><strong>✓</strong> Auto-refill is enabled</div>' : ''}
            
            ${prescriptionUrl ? `
              <div style="margin-top: 20px; text-align: center;">
                <a href="${prescriptionUrl}" class="button">View Prescription Details</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This refill was automatically requested by your Concierge AI assistant.</p>
            <p>You will receive another notification when your prescription is ready for pickup.</p>
            ${!autoRefillEnabled ? '<p><strong>Tip:</strong> Enable auto-refill to automatically request refills when available.</p>' : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRefillRequestedText(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber, estimatedReadyDate, autoRefillEnabled } = notification;
    const readyDate = estimatedReadyDate 
      ? estimatedReadyDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Next business day';

    return `
PRESCRIPTION REFILL REQUESTED

💊 ${medicationName}${dosage ? ` (${dosage})` : ''}
Pharmacy: ${pharmacy}
${orderNumber ? `Order Number: ${orderNumber}\n` : ''}Estimated Ready Date: ${readyDate}
${autoRefillEnabled ? '✓ Auto-refill is enabled\n' : ''}

This refill was automatically requested by your Concierge AI assistant.
You will receive another notification when your prescription is ready for pickup.
${!autoRefillEnabled ? '\nTip: Enable auto-refill to automatically request refills when available.' : ''}
    `.trim();
  }

  private getRefillAvailableHTML(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber, prescriptionUrl, autoRefillEnabled } = notification;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prescription Refill Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .medication { font-size: 18px; font-weight: bold; color: #856404; margin-bottom: 10px; }
          .info { margin: 10px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 12px 24px; background: #ffc107; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 Prescription Refill Available</h1>
            <p>Your prescription is ready for refill.</p>
          </div>
          
          <div class="details">
            <div class="medication">💊 ${medicationName}${dosage ? ` (${dosage})` : ''}</div>
            <div class="info"><strong>Pharmacy:</strong> ${pharmacy}</div>
            ${orderNumber ? `<div class="info"><strong>Order Number:</strong> ${orderNumber}</div>` : ''}
            
            ${prescriptionUrl ? `
              <div style="margin-top: 20px; text-align: center;">
                <a href="${prescriptionUrl}" class="button">Request Refill</a>
              </div>
            ` : ''}
            
            ${autoRefillEnabled ? `
              <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 6px; text-align: center;">
                <strong>Auto-refill is enabled</strong> - Your refill will be requested automatically.
              </div>
            ` : `
              <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                <strong>💡 Tip:</strong> Enable auto-refill to automatically request refills when available.
              </div>
            `}
          </div>
          
          <div class="footer">
            <p>This notification was sent by your Concierge AI assistant.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRefillAvailableText(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber, autoRefillEnabled } = notification;

    return `
PRESCRIPTION REFILL AVAILABLE

💊 ${medicationName}${dosage ? ` (${dosage})` : ''}
Pharmacy: ${pharmacy}
${orderNumber ? `Order Number: ${orderNumber}\n` : ''}
${autoRefillEnabled 
  ? 'Auto-refill is enabled - Your refill will be requested automatically.\n'
  : 'Tip: Enable auto-refill to automatically request refills when available.\n'
}
This notification was sent by your Concierge AI assistant.
    `.trim();
  }

  private getRefillReadyHTML(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber, prescriptionUrl } = notification;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prescription Ready for Pickup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
          .medication { font-size: 18px; font-weight: bold; color: #0c5460; margin-bottom: 10px; }
          .info { margin: 10px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Prescription Ready for Pickup</h1>
            <p>Your prescription is ready at the pharmacy.</p>
          </div>
          
          <div class="details">
            <div class="medication">💊 ${medicationName}${dosage ? ` (${dosage})` : ''}</div>
            <div class="info"><strong>Pharmacy:</strong> ${pharmacy}</div>
            ${orderNumber ? `<div class="info"><strong>Order Number:</strong> ${orderNumber}</div>` : ''}
            <div class="info"><strong>Status:</strong> Ready for pickup</div>
            
            ${prescriptionUrl ? `
              <div style="margin-top: 20px; text-align: center;">
                <a href="${prescriptionUrl}" class="button">View Prescription Details</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This notification was sent by your Concierge AI assistant.</p>
            <p>Please pick up your prescription at your earliest convenience.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRefillReadyText(notification: PrescriptionRefillNotification): string {
    const { medicationName, dosage, pharmacy, orderNumber } = notification;

    return `
PRESCRIPTION READY FOR PICKUP

💊 ${medicationName}${dosage ? ` (${dosage})` : ''}
Pharmacy: ${pharmacy}
${orderNumber ? `Order Number: ${orderNumber}\n` : ''}Status: Ready for pickup

This notification was sent by your Concierge AI assistant.
Please pick up your prescription at your earliest convenience.
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
