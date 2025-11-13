import { UserPreferences } from '@/lib/models/UserPreferences';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { CalendarService } from './calendar';
import { InAppCalendarService } from './in-app-calendar';
import { AppleCalendarService } from './apple-calendar';

export interface CalendarSyncResult {
  success: boolean;
  externalEventId?: string;
  externalEventUrl?: string;
  externalCalendarUrl?: string; // Alias for externalEventUrl for consistency
  calendarType?: 'google' | 'apple' | 'outlook' | 'caldav';
  error?: string;
}

export class CalendarSyncService {
  async syncEventToExternalCalendar(
    event: any, 
    userId: string, 
    provider: 'google' | 'outlook' | 'apple' | 'caldav'
  ): Promise<CalendarSyncResult> {
    try {
      console.log(`🔄 Syncing event to ${provider} calendar:`, event._id);
      
      switch (provider) {
        case 'google':
          return await this.syncToGoogleCalendar(event, userId);
        case 'outlook':
          return await this.syncToOutlookCalendar(event, userId);
        case 'apple':
          return await this.syncToAppleCalendar(event, userId);
        case 'caldav':
          return await this.syncToCalDAV(event, userId);
        default:
          return {
            success: false,
            error: `Unsupported calendar provider: ${provider}`
          };
      }
    } catch (error) {
      console.error(`❌ Error syncing to ${provider}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async syncToGoogleCalendar(event: any, userId: string): Promise<CalendarSyncResult> {
    try {
      const calendarService = new CalendarService();
      
      const appointmentEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: event.endDate.toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        location: event.location,
        attendees: event.attendees?.map((email: string) => ({ email })) || []
      };

      const result = await calendarService.createEvent(appointmentEvent, 'brtracker.docs@gmail.com', userId);
      
      if (result.success) {
        // Update the internal event with external calendar info
        await CalendarEvent.findByIdAndUpdate(event._id, {
          googleEventId: result.eventId,
          googleEventUrl: result.eventUrl
        });
        
        return {
          success: true,
          externalEventId: result.eventId,
          externalEventUrl: result.eventUrl,
          externalCalendarUrl: result.eventUrl,
          calendarType: 'google'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create Google Calendar event'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google Calendar sync failed'
      };
    }
  }

  private async syncToOutlookCalendar(event: any, userId: string): Promise<CalendarSyncResult> {
    // TODO: Implement Outlook Calendar sync
    return {
      success: false,
      error: 'Outlook Calendar sync not yet implemented'
    };
  }

  private async syncToAppleCalendar(event: any, userId: string): Promise<CalendarSyncResult> {
    try {
      // Get user's Apple Calendar configuration
      const preferences = await this.getUserCalendarPreferences(userId);
      const appleConfig = preferences?.calendarPreferences?.appleCalendarConfig;
      
      if (!appleConfig) {
        return {
          success: false,
          error: 'Apple Calendar not configured. Please set up your Apple Calendar credentials in settings.'
        };
      }

      const appleCalendarService = new AppleCalendarService(appleConfig);
      const result = await appleCalendarService.createEvent(event, userId);
      
      if (result.success) {
        // Update the internal event with Apple Calendar info
        await CalendarEvent.findByIdAndUpdate(event._id, {
          appleEventId: result.eventId,
          appleEventUrl: result.eventUrl
        });
        
        return {
          success: true,
          externalEventId: result.eventId,
          externalEventUrl: result.eventUrl,
          externalCalendarUrl: result.eventUrl,
          calendarType: 'apple'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create Apple Calendar event'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Apple Calendar sync failed'
      };
    }
  }

  private async syncToCalDAV(event: any, userId: string): Promise<CalendarSyncResult> {
    // TODO: Implement CalDAV sync
    return {
      success: false,
      error: 'CalDAV sync not yet implemented'
    };
  }

  async getUserCalendarPreferences(userId: string) {
    try {
      const preferences = await UserPreferences.findOne({ userId });
      
      if (!preferences) {
        // Create default preferences
        const defaultPreferences = new UserPreferences({
          userId,
          calendarPreferences: {
            primaryProvider: 'internal',
            syncEnabled: false,
            syncDirection: 'internal-to-external',
            syncSettings: {
              autoSync: true,
              syncInterval: 15,
              syncOnCreate: true,
              syncOnUpdate: true,
              syncOnDelete: true
            }
          }
        });
        
        await defaultPreferences.save();
        return defaultPreferences;
      }
      
      return preferences;
    } catch (error) {
      console.error('❌ Error fetching user preferences:', error);
      return null;
    }
  }

  async updateUserCalendarPreferences(userId: string, preferences: Partial<IUserPreferences>) {
    try {
      const updated = await UserPreferences.findOneAndUpdate(
        { userId },
        { $set: preferences },
        { new: true, upsert: true }
      );
      
      console.log('✅ User calendar preferences updated:', updated._id);
      return updated;
    } catch (error) {
      console.error('❌ Error updating user preferences:', error);
      return null;
    }
  }

  async syncEventIfEnabled(event: any, userId: string) {
    try {
      const preferences = await this.getUserCalendarPreferences(userId);
      
      if (!preferences || !preferences.calendarPreferences.syncEnabled) {
        console.log('📅 Calendar sync disabled for user:', userId);
        return { success: true, message: 'Sync disabled' };
      }

      const provider = preferences.calendarPreferences.primaryProvider;
      
      if (provider === 'internal') {
        console.log('📅 Using internal calendar only');
        return { success: true, message: 'Internal calendar only' };
      }

      // Sync to external calendar
      const syncResult = await this.syncEventToExternalCalendar(
        event, 
        userId, 
        provider as 'google' | 'outlook' | 'apple' | 'caldav'
      );

      // Add calendar type to result
      syncResult.calendarType = provider as 'google' | 'apple' | 'outlook' | 'caldav';

      if (syncResult.success) {
        console.log(`✅ Event synced to ${provider}:`, syncResult.externalEventId);
      } else {
        console.error(`❌ Failed to sync to ${provider}:`, syncResult.error);
      }

      return syncResult;
    } catch (error) {
      console.error('❌ Error in syncEventIfEnabled:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Automatically sync event to Apple Calendar if configured
   * This bypasses user preferences and always attempts sync if Apple Calendar is configured
   */
  async syncToAppleCalendarIfConfigured(event: any, userId: string): Promise<CalendarSyncResult> {
    try {
      const preferences = await this.getUserCalendarPreferences(userId);
      const appleConfig = preferences?.calendarPreferences?.appleCalendarConfig;
      
      if (!appleConfig || !appleConfig.serverUrl || !appleConfig.username) {
        console.log('🍎 Apple Calendar not configured, skipping auto-sync');
        return { 
          success: false, 
          error: 'Apple Calendar not configured' 
        };
      }

      // Attempt to sync to Apple Calendar
      console.log('🍎 Auto-syncing event to Apple Calendar...');
      const syncResult = await this.syncToAppleCalendar(event, userId);
      
      if (syncResult.success) {
        console.log('✅ Event auto-synced to Apple Calendar:', syncResult.externalEventId);
      } else {
        console.log('⚠️ Apple Calendar auto-sync failed (non-blocking):', syncResult.error);
      }

      return syncResult;
    } catch (error) {
      console.error('❌ Error in auto-sync to Apple Calendar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-sync failed'
      };
    }
  }
}
