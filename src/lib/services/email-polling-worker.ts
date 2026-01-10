import { emailPollingService } from './email-polling';
import EmailAccount from '@/lib/db/models/EmailAccount';
import connectDB from '@/lib/db/mongodb';

/**
 * Background worker service for email polling
 * Initializes and manages email polling for all enabled accounts
 */
export class EmailPollingWorker {
  private isInitialized: boolean = false;

  /**
   * Initialize the worker - start polling for all enabled accounts
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📧 Email polling worker already initialized');
      return;
    }

    try {
      console.log('📧 Initializing email polling worker...');
      await connectDB();

      // Find all enabled email accounts
      const accounts = await EmailAccount.find({ enabled: true })
        .lean();

      console.log(`📧 Found ${accounts.length} enabled email account(s)`);

      // Start polling for each account
      for (const account of accounts) {
        try {
          await emailPollingService.startPolling({
            userId: account.userId,
            emailAddress: account.emailAddress,
            provider: account.provider,
            credentials: account.credentials,
            enabled: account.enabled,
            scanInterval: account.scanInterval,
            lastChecked: account.lastChecked,
            lastMessageId: account.lastMessageId
          });
        } catch (error) {
          console.error(`❌ Failed to start polling for ${account.emailAddress}:`, error);
        }
      }

      this.isInitialized = true;
      console.log('✅ Email polling worker initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing email polling worker:', error);
    }
  }

  /**
   * Restart polling for a specific user
   */
  async restartForUser(userId: string): Promise<void> {
    try {
      await connectDB();
      const accounts = await EmailAccount.find({ userId, enabled: true }).lean();

      for (const account of accounts) {
        await emailPollingService.startPolling({
          userId: account.userId,
          emailAddress: account.emailAddress,
          provider: account.provider,
          credentials: account.credentials,
          enabled: account.enabled,
          scanInterval: account.scanInterval,
          lastChecked: account.lastChecked,
          lastMessageId: account.lastMessageId
        });
      }
    } catch (error) {
      console.error(`❌ Error restarting polling for user ${userId}:`, error);
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    // The emailPollingService manages its own intervals
    // This is a placeholder for future cleanup if needed
    console.log('📧 Email polling worker stopped');
  }
}

// Singleton instance
export const emailPollingWorker = new EmailPollingWorker();

// Auto-initialize on module load (for server-side)
if (typeof window === 'undefined') {
  // Only run on server-side
  emailPollingWorker.initialize().catch(err => {
    console.error('Failed to auto-initialize email polling worker:', err);
  });
}

