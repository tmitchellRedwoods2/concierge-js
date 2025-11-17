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
   * Manually trigger a scan for a specific account (public method)
   */
  async scanNow(userId: string, emailAddress: string): Promise<{ success: boolean; message: string; emailCount?: number }> {
    const accountKey = `${userId}:${emailAddress}`;
    
    // We need to get the account details from the database
    // For now, we'll need to pass the account object
    // This method will be called from the API route which has access to the account
    return {
      success: false,
      message: 'Account not found. Use scanAccount method with account object.'
    };
  }

  /**
   * Manually trigger a scan for a specific account (with account object)
   */
  async scanAccount(account: EmailAccount, hoursBack: number = 168): Promise<{ success: boolean; message: string; emailCount?: number }> {
    try {
      const accountKey = `${account.userId}:${account.emailAddress}`;
      
      if (this.isPolling.get(accountKey)) {
        return {
          success: false,
          message: 'Scan already in progress for this account'
        };
      }

      console.log(`📧 Manual scan triggered for ${account.emailAddress} (looking back ${hoursBack} hours / ${Math.round(hoursBack/24)} days)`);
      
      // Track email count via event listener
      let emailCount = 0;
      let resolved = false;
      
      const handler = (data: { account: EmailAccount; emailCount: number }) => {
        if (data.account.emailAddress === account.emailAddress && !resolved) {
          emailCount = data.emailCount;
          resolved = true;
          this.removeListener('emailsProcessed', handler);
        }
      };
      
      this.on('emailsProcessed', handler);
      
      // For manual scans, create a temporary account without lastMessageId
      // This allows us to scan older emails, but we'll still check for duplicates
      const scanAccount = { 
        ...account,
        lastMessageId: undefined // Clear lastMessageId to scan all emails in time window
      };
      
      // Store original fetchEmails method
      const originalFetchGmail = this.fetchGmailEmails.bind(this);
      const originalFetchOutlook = this.fetchOutlookEmails.bind(this);
      
      // Override fetch methods to use extended time window
      this.fetchGmailEmails = async (acc: EmailAccount) => {
        return originalFetchGmail(acc, hoursBack);
      };
      this.fetchOutlookEmails = async (acc: EmailAccount) => {
        return originalFetchOutlook(acc, hoursBack);
      };
      
      // Trigger the scan
      await this.pollEmails(scanAccount);
      
      // Restore original fetch methods
      this.fetchGmailEmails = originalFetchGmail;
      this.fetchOutlookEmails = originalFetchOutlook;
      
      // Wait a bit for the event to fire, then clean up
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!resolved) {
        this.removeListener('emailsProcessed', handler);
        // If no event fired, assume no emails were found
        emailCount = 0;
      }
      
      return {
        success: true,
        message: emailCount > 0 
          ? `Scan completed. Found ${emailCount} new email(s).`
          : 'Scan completed. No new emails found.',
        emailCount
      };
    } catch (error) {
      console.error(`❌ Error in manual scan for ${account.emailAddress}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
      const emails = await this.fetchEmails(account, 24);
      
      console.log(`📧 Email fetch completed for ${account.emailAddress}: ${emails.length} email(s) found`);
      
      if (emails.length === 0) {
        console.log(`⚠️ No emails found for ${account.emailAddress}`);
        console.log(`⚠️ This could mean:`);
        console.log(`   1. No emails in inbox matching the query`);
        console.log(`   2. All emails were already processed (check lastMessageId)`);
        console.log(`   3. Gmail API query issue`);
        console.log(`   4. Email provider authentication issue`);
        return;
      }

      console.log(`✅ Found ${emails.length} email(s) to process for ${account.emailAddress}`);
      emails.forEach((email, index) => {
        console.log(`   ${index + 1}. Subject: "${email.subject}" from ${email.from} (ID: ${email.messageId.substring(0, 20)}...)`);
      });

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
  private async fetchGmailEmails(account: EmailAccount, hoursBack: number = 24): Promise<PolledEmail[]> {
    try {
      const { GmailAPIService } = await import('./gmail-api');
      
      if (!account.credentials.accessToken || !account.credentials.refreshToken) {
        console.error('📧 Gmail credentials missing for', account.emailAddress);
        return [];
      }

      const gmailService = new GmailAPIService({
        accessToken: account.credentials.accessToken,
        refreshToken: account.credentials.refreshToken,
        clientId: account.credentials.clientId,
        clientSecret: account.credentials.clientSecret
      });

      // For manual scans, look back 7 days to catch older test emails
      // For automatic scans, use 24 hours
      const hoursBack = 24; // Default to 24 hours
      const emails = await gmailService.fetchEmails(account.lastMessageId, 10, hoursBack);
      
      // Update credentials if they were refreshed
      const updatedCredentials = gmailService.getCredentials();
      if (updatedCredentials.accessToken !== account.credentials.accessToken) {
        account.credentials = { ...account.credentials, ...updatedCredentials };
      }

      return emails;
    } catch (error) {
      console.error('❌ Error fetching Gmail emails:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from Outlook using Microsoft Graph API
   */
  private async fetchOutlookEmails(account: EmailAccount, hoursBack: number = 24): Promise<PolledEmail[]> {
    try {
      const { OutlookAPIService } = await import('./outlook-api');
      
      if (!account.credentials.accessToken) {
        console.error('📧 Outlook credentials missing for', account.emailAddress);
        return [];
      }

      const outlookService = new OutlookAPIService({
        accessToken: account.credentials.accessToken,
        refreshToken: account.credentials.refreshToken || '',
        tenantId: account.credentials.tenantId,
        clientId: account.credentials.clientId,
        clientSecret: account.credentials.clientSecret
      });

      const emails = await outlookService.fetchEmails(account.lastMessageId, 10, hoursBack);
      
      // Update credentials if they were refreshed
      const updatedCredentials = outlookService.getCredentials();
      if (updatedCredentials.accessToken !== account.credentials.accessToken) {
        account.credentials = { ...account.credentials, ...updatedCredentials };
      }

      return emails;
    } catch (error) {
      console.error('❌ Error fetching Outlook emails:', error);
      throw error;
    }
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
        console.log(`⚠️ Email does not contain appointment information: "${email.subject}"`);
        console.log(`   Email body preview: ${email.body.substring(0, 200)}...`);
        
        // Still process through email trigger system for other automation rules
        await emailTriggerService.processEmail({
          from: email.from,
          subject: email.subject,
          body: email.body,
          userId
        });
        
        return;
      }

      console.log(`✅ Parsed appointment from email: "${email.subject}"`);
      console.log(`   Title: ${parsedAppointment.title}`);
      console.log(`   Date: ${parsedAppointment.startDate.toISOString()}`);
      console.log(`   Location: ${parsedAppointment.location || 'Not specified'}`);
      console.log(`   Confidence: ${(parsedAppointment.confidence * 100).toFixed(0)}%`);

      await connectDB();

      // Check for duplicates - use a more flexible date range (within 1 hour)
      const oneHourBefore = new Date(parsedAppointment.startDate.getTime() - 60 * 60 * 1000);
      const oneHourAfter = new Date(parsedAppointment.startDate.getTime() + 60 * 60 * 1000);
      
      const existingEvent = await CalendarEvent.findOne({
        userId,
        startDate: {
          $gte: oneHourBefore,
          $lte: oneHourAfter
        },
        title: { $regex: new RegExp(parsedAppointment.title, 'i') }
      });

      if (existingEvent) {
        console.log(`⚠️ Event already exists, skipping duplicate: ${parsedAppointment.title}`);
        console.log(`   Existing event ID: ${existingEvent._id}`);
        console.log(`   Existing event date: ${existingEvent.startDate}`);
        console.log(`   New event would be: ${parsedAppointment.startDate}`);
        console.log(`   Date difference: ${Math.abs(existingEvent.startDate.getTime() - parsedAppointment.startDate.getTime()) / 1000 / 60} minutes`);
        return;
      }
      
      console.log(`📅 No duplicate found, creating new calendar event...`);
      console.log(`   Event title: ${parsedAppointment.title}`);
      console.log(`   Event date: ${parsedAppointment.startDate.toISOString()}`);
      console.log(`   Event location: ${parsedAppointment.location || 'Not specified'}`);

      // Create calendar event
      console.log(`📅 Attempting to create calendar event...`);
      console.log(`   Event data:`, {
        title: parsedAppointment.title,
        startDate: parsedAppointment.startDate,
        endDate: parsedAppointment.endDate,
        location: parsedAppointment.location || '',
        userId,
        source: 'email',
        createdBy: userId,
        status: 'confirmed'
      });

      let event;
      let eventId;
      
      try {
        event = new CalendarEvent({
          title: parsedAppointment.title,
          startDate: parsedAppointment.startDate,
          endDate: parsedAppointment.endDate,
          location: parsedAppointment.location || '',
          description: parsedAppointment.description || '',
          userId,
          attendees: parsedAppointment.attendees || [],
          source: 'email',
          createdBy: userId,
          status: 'confirmed'
        });

        console.log(`📅 CalendarEvent object created, attempting to save...`);
        await event.save();
        eventId = event._id.toString();

        console.log(`✅ SUCCESS: Created calendar event in database!`);
        console.log(`   Event ID: ${eventId}`);
        console.log(`   Title: ${parsedAppointment.title}`);
        console.log(`   Start Date: ${parsedAppointment.startDate.toISOString()}`);
        console.log(`   End Date: ${parsedAppointment.endDate.toISOString()}`);
        console.log(`   Location: ${parsedAppointment.location || 'Not specified'}`);
        console.log(`   Source: email`);
        console.log(`   User ID: ${userId}`);
      } catch (saveError: any) {
        console.error(`❌ ERROR: Failed to save calendar event to database!`);
        console.error(`   Error:`, saveError);
        console.error(`   Error message:`, saveError?.message);
        console.error(`   Error stack:`, saveError?.stack);
        if (saveError?.errors) {
          console.error(`   Validation errors:`, saveError.errors);
        }
        throw saveError; // Re-throw to be caught by outer try-catch
      }

      // Automatically sync to external calendar (only if event was successfully created)
      if (!eventId) {
        console.error(`❌ Cannot sync event - eventId is missing!`);
        return;
      }

      try {
        console.log(`📅 Attempting to sync event to external calendar...`);
        const calendarSyncService = new CalendarSyncService();
        
        // First try the normal sync (respects user preferences)
        let syncResult = await calendarSyncService.syncEventIfEnabled(
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
        
        // If sync is disabled or using internal calendar, try Apple Calendar auto-sync as fallback
        if (!syncResult.success && (syncResult.message === 'Sync disabled' || syncResult.message === 'Internal calendar only')) {
          console.log(`📅 Sync disabled or internal-only, trying Apple Calendar auto-sync...`);
          syncResult = await calendarSyncService.syncToAppleCalendarIfConfigured(
            {
              _id: eventId,
              id: eventId,
              title: parsedAppointment.title,
              startDate: parsedAppointment.startDate,
              endDate: parsedAppointment.endDate,
              location: parsedAppointment.location || '',
              description: parsedAppointment.description || '',
              attendees: parsedAppointment.attendees || []
            },
            userId
          );
        }

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

      // Send notification to user (only if event was successfully created)
      if (!eventId) {
        console.error(`❌ Cannot send notification - eventId is missing!`);
        return;
      }

      try {
        console.log(`📧 Attempting to send notification for event ${eventId}...`);
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
        console.log(`✅ Notification sent successfully`);
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

