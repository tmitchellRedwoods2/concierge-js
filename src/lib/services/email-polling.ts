import { EventEmitter } from 'events';
import { emailParserService } from './email-parser';
import { emailTriggerService } from './email-trigger';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { CalendarSyncService } from './calendar-sync';
import { NotificationService } from './notification-service';
import connectDB from '@/lib/db/mongodb';

export interface EmailAccount {
  userId: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  credentials: {
    // For Gmail OAuth
    accessToken?: string;
    refreshToken?: string;
    // For IMAP/Exchange
    username?: string;
    password?: string;
    server?: string;
    port?: number;
    secure?: boolean;
  };
  enabled: boolean;
  lastChecked?: Date;
  lastMessageId?: string;
  scanInterval: number; // minutes
}

export interface PolledEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  messageId: string;
}

export class EmailPollingService extends EventEmitter {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isPolling: Map<string, boolean> = new Map();

  /**
   * Start polling emails for a user's email account
   */
  async startPolling(account: EmailAccount): Promise<void> {
    if (!account.enabled) {
      console.log(`📧 Email polling disabled for ${account.emailAddress}`);
      return;
    }

    const accountKey = `${account.userId}:${account.emailAddress}`;
    
    // Stop existing polling if any
    this.stopPolling(account.userId, account.emailAddress);

    console.log(`📧 Starting email polling for ${account.emailAddress} (checking every ${account.scanInterval} minutes)`);

    // Poll immediately
    await this.pollEmails(account);

    // Set up interval for periodic polling
    const intervalMs = account.scanInterval * 60 * 1000;
    const interval = setInterval(async () => {
      if (!this.isPolling.get(accountKey)) {
        await this.pollEmails(account);
      }
    }, intervalMs);

    this.pollingIntervals.set(accountKey, interval);
  }

  /**
   * Stop polling emails for a specific account
   */
  stopPolling(userId: string, emailAddress: string): void {
    const accountKey = `${userId}:${emailAddress}`;
    const interval = this.pollingIntervals.get(accountKey);
    
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(accountKey);
      this.isPolling.delete(accountKey);
      console.log(`📧 Stopped email polling for ${emailAddress}`);
    }
  }

  /**
   * Stop all polling for a user
   */
  stopAllPolling(userId: string): void {
    const keysToStop: string[] = [];
    
    this.pollingIntervals.forEach((interval, key) => {
      if (key.startsWith(`${userId}:`)) {
        clearInterval(interval);
        keysToStop.push(key);
      }
    });

    keysToStop.forEach(key => {
      this.pollingIntervals.delete(key);
      this.isPolling.delete(key);
    });

    console.log(`📧 Stopped all email polling for user ${userId}`);
  }

  /**
   * Poll emails from the account
   */
  private async pollEmails(account: EmailAccount): Promise<void> {
    const accountKey = `${account.userId}:${account.emailAddress}`;
    
    if (this.isPolling.get(accountKey)) {
      console.log(`📧 Already polling ${account.emailAddress}, skipping...`);
      return;
    }

    this.isPolling.set(accountKey, true);

    try {
      console.log(`📧 Polling emails for ${account.emailAddress}...`);
      
      // Fetch new emails based on provider
      const emails = await this.fetchEmails(account);
      
      if (emails.length === 0) {
        console.log(`📧 No new emails found for ${account.emailAddress}`);
        return;
      }

      console.log(`📧 Found ${emails.length} new email(s) for ${account.emailAddress}`);

      // Process each email
      for (const email of emails) {
        await this.processEmail(email, account.userId);
      }

      // Update last checked time and last message ID
      if (emails.length > 0) {
        const lastEmail = emails[emails.length - 1];
        account.lastChecked = new Date();
        account.lastMessageId = lastEmail.messageId;
        
        // Emit event for account update
        this.emit('emailsProcessed', {
          account,
          emailCount: emails.length,
          lastMessageId: lastEmail.messageId
        });
      }

    } catch (error) {
      console.error(`❌ Error polling emails for ${account.emailAddress}:`, error);
      this.emit('pollingError', {
        account,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.isPolling.set(accountKey, false);
    }
  }

  /**
   * Fetch emails from the account based on provider
   */
  private async fetchEmails(account: EmailAccount): Promise<PolledEmail[]> {
    switch (account.provider) {
      case 'gmail':
        return await this.fetchGmailEmails(account);
      case 'outlook':
        return await this.fetchOutlookEmails(account);
      case 'imap':
      case 'exchange':
        return await this.fetchIMAPEmails(account);
      default:
        throw new Error(`Unsupported email provider: ${account.provider}`);
    }
  }

  /**
   * Fetch emails from Gmail using Gmail API
   */
  private async fetchGmailEmails(account: EmailAccount): Promise<PolledEmail[]> {
    // TODO: Implement Gmail API integration
    // For now, return empty array
    // This would use Google OAuth tokens to access Gmail API
    console.log('📧 Gmail API integration not yet implemented');
    return [];
  }

  /**
   * Fetch emails from Outlook using Microsoft Graph API
   */
  private async fetchOutlookEmails(account: EmailAccount): Promise<PolledEmail[]> {
    // TODO: Implement Microsoft Graph API integration
    // For now, return empty array
    console.log('📧 Outlook API integration not yet implemented');
    return [];
  }

  /**
   * Fetch emails using IMAP
   */
  private async fetchIMAPEmails(account: EmailAccount): Promise<PolledEmail[]> {
    // TODO: Implement IMAP integration using imap library
    // For now, return empty array
    // This would use credentials to connect via IMAP and fetch new messages
    console.log('📧 IMAP integration not yet implemented');
    return [];
  }

  /**
   * Process a single email - parse and create calendar events
   */
  private async processEmail(email: PolledEmail, userId: string): Promise<void> {
    try {
      console.log(`📧 Processing email: ${email.subject} from ${email.from}`);

      // Parse appointment details from email
      const parsedAppointment = emailParserService.parseAppointmentEmail({
        from: email.from,
        subject: email.subject,
        body: email.body
      });

      if (!parsedAppointment) {
        console.log(`⚠️ Email does not contain appointment information: ${email.subject}`);
        
        // Still process through email trigger system for other automation rules
        await emailTriggerService.processEmail({
          from: email.from,
          subject: email.subject,
          body: email.body,
          userId
        });
        
        return;
      }

      console.log(`✅ Parsed appointment: ${parsedAppointment.title} on ${parsedAppointment.startDate}`);

      await connectDB();

      // Check for duplicates
      const existingEvent = await CalendarEvent.findOne({
        userId,
        startDate: parsedAppointment.startDate,
        title: { $regex: new RegExp(parsedAppointment.title, 'i') }
      });

      if (existingEvent) {
        console.log(`⚠️ Event already exists, skipping: ${parsedAppointment.title}`);
        return;
      }

      // Create calendar event
      const event = new CalendarEvent({
        title: parsedAppointment.title,
        startDate: parsedAppointment.startDate,
        endDate: parsedAppointment.endDate,
        location: parsedAppointment.location || '',
        description: parsedAppointment.description || '',
        userId,
        attendees: parsedAppointment.attendees || [],
        allDay: parsedAppointment.allDay || false,
        source: 'email',
        createdBy: userId,
        status: 'confirmed'
      });

      await event.save();
      const eventId = event._id.toString();

      console.log(`📅 Created calendar event: ${eventId} - ${parsedAppointment.title}`);

      // Automatically sync to external calendar
      try {
        const calendarSyncService = new CalendarSyncService();
        const syncResult = await calendarSyncService.syncEventIfEnabled(
          {
            _id: eventId,
            id: eventId,
            title: parsedAppointment.title,
            startDate: parsedAppointment.startDate.toISOString(),
            endDate: parsedAppointment.endDate.toISOString(),
            location: parsedAppointment.location || '',
            description: parsedAppointment.description || '',
            attendees: parsedAppointment.attendees || []
          },
          userId
        );

        if (syncResult.success && syncResult.externalEventId) {
          console.log(`📅 Event synced to external calendar: ${syncResult.externalEventId}`);
          
          if (syncResult.calendarType === 'google') {
            event.googleEventId = syncResult.externalEventId;
            event.googleEventUrl = syncResult.externalCalendarUrl;
          } else if (syncResult.calendarType === 'apple') {
            event.appleEventId = syncResult.externalEventId;
            event.appleEventUrl = syncResult.externalCalendarUrl;
          }
          await event.save();
        }
      } catch (error) {
        console.error('⚠️ Calendar sync error (non-blocking):', error);
      }

      // Send notification to user
      try {
        const notificationService = new NotificationService();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const icsUrl = `${baseUrl}/api/calendar/event/${eventId}/ics`;

        await notificationService.sendAppointmentConfirmation(
          {
            _id: eventId,
            id: eventId,
            title: parsedAppointment.title,
            startDate: parsedAppointment.startDate.toISOString(),
            endDate: parsedAppointment.endDate.toISOString(),
            location: parsedAppointment.location,
            description: parsedAppointment.description,
            attendees: parsedAppointment.attendees
          },
          userId,
          email.to,
          'User',
          `/calendar/event/${eventId}`,
          icsUrl
        );
      } catch (error) {
        console.error('⚠️ Failed to send notification:', error);
      }

      // Process through email trigger system for other automation rules
      await emailTriggerService.processEmail({
        from: email.from,
        subject: email.subject,
        body: email.body,
        userId
      });

      this.emit('appointmentCreated', {
        userId,
        eventId,
        email,
        appointment: parsedAppointment
      });

    } catch (error) {
      console.error(`❌ Error processing email ${email.id}:`, error);
      this.emit('processingError', {
        email,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Singleton instance
export const emailPollingService = new EmailPollingService();

