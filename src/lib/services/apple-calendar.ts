import { CalendarEvent } from '@/lib/models/CalendarEvent';

export interface AppleCalendarConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarPath: string;
}

export interface AppleCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

export class AppleCalendarService {
  private config: AppleCalendarConfig;

  constructor(config: AppleCalendarConfig) {
    this.config = config;
  }

  /**
   * Get cleaned credentials (trimmed, no spaces in password)
   */
  private getCleanedCredentials(): { username: string; password: string } {
    const username = (this.config.username || '').trim();
    const password = (this.config.password || '').trim().replace(/\s/g, '');
    return { username, password };
  }

  async createEvent(event: any, userId: string): Promise<{ success: boolean; eventId?: string; eventUrl?: string; error?: string }> {
    try {
      console.log('🍎 Creating Apple Calendar event:', event.title);
      
      // Generate unique UID for the event
      const uid = `concierge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create CalDAV event data
      const caldavEvent = this.createCalDAVEvent(event, uid);
      
      // Upload to CalDAV server
      const eventUrl = await this.uploadEventToCalDAV(caldavEvent, uid);
      
      if (eventUrl) {
        // Update the internal event with Apple Calendar info
        await CalendarEvent.findByIdAndUpdate(event._id, {
          appleEventId: uid,
          appleEventUrl: eventUrl
        });
        
        console.log('✅ Apple Calendar event created:', uid);
        
        return {
          success: true,
          eventId: uid,
          eventUrl: eventUrl
        };
      } else {
        return {
          success: false,
          error: 'Failed to upload event to Apple Calendar'
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Apple Calendar sync failed'
      };
    }
  }

  private createCalDAVEvent(event: any, uid: string): string {
    const startDate = this.formatCalDAVDate(event.startDate);
    const endDate = this.formatCalDAVDate(event.endDate);
    const now = this.formatCalDAVDate(new Date());
    
    const attendees = event.attendees?.map((email: string) => 
      `ATTENDEE:mailto:${email}`
    ).join('\n') || '';
    
    const location = event.location ? `LOCATION:${event.location}` : '';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Concierge AI//Calendar Integration//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
${location}
${attendees}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  }

  private formatCalDAVDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private async uploadEventToCalDAV(eventData: string, uid: string): Promise<string | null> {
    try {
      const { username, password } = this.getCleanedCredentials();
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${uid}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: eventData
      });

      if (response.ok) {
        console.log('✅ Event uploaded to Apple Calendar:', eventUrl);
        return eventUrl;
      } else {
        console.error('❌ Failed to upload to Apple Calendar:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ CalDAV upload error:', error);
      return null;
    }
  }

  private async testAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test authentication with a simple PROPFIND request to the root
      // This is more reliable than OPTIONS for CalDAV servers
      const testUrl = `${this.config.serverUrl}/`;
      console.log('🔐 Testing authentication with:', testUrl);
      console.log('🔐 Username:', this.config.username);
      console.log('🔐 Password length:', this.config.password?.length || 0);
      console.log('🔐 Password starts with:', this.config.password?.substring(0, 4) || 'N/A');
      
      // Verify credentials are present and properly formatted
      if (!this.config.password || this.config.password.trim().length === 0) {
        console.error('❌ Password is empty or missing');
        return {
          success: false,
          error: 'Password is missing. Please enter your App-Specific Password.'
        };
      }
      
      if (!this.config.username || this.config.username.trim().length === 0) {
        console.error('❌ Username is empty or missing');
        return {
          success: false,
          error: 'Username is missing. Please enter your Apple ID email address.'
        };
      }
      
      // Get cleaned credentials
      const { username: cleanUsername, password: cleanPassword } = this.getCleanedCredentials();
      
      console.log('🔐 Cleaned username:', cleanUsername);
      console.log('🔐 Cleaned password length:', cleanPassword.length);
      console.log('🔐 Password format check:', {
        hasDashes: cleanPassword.includes('-'),
        hasSpaces: cleanPassword.includes(' '),
        length: cleanPassword.length,
        first4Chars: cleanPassword.substring(0, 4),
        last4Chars: cleanPassword.substring(cleanPassword.length - 4)
      });
      
      const authHeader = `Basic ${Buffer.from(`${cleanUsername}:${cleanPassword}`).toString('base64')}`;
      console.log('🔐 Auth header length:', authHeader.length);
      console.log('🔐 Auth header preview:', authHeader.substring(0, 20) + '...');
      
      const response = await fetch(testUrl, {
        method: 'PROPFIND',
        headers: {
          'Content-Type': 'application/xml',
          'Depth': '0',
          'Authorization': authHeader,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`
      });
      
      const responseText = await response.text().catch(() => '');
      console.log('🔐 Authentication test response:', response.status, response.statusText);
      console.log('🔐 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔐 Response body preview:', responseText.substring(0, 500));
      
      if (response.status === 401 || response.status === 403) {
        // Check if there's a WWW-Authenticate header that might give us more info
        const wwwAuth = response.headers.get('WWW-Authenticate');
        console.error('❌ Authentication failed:', {
          status: response.status,
          statusText: response.statusText,
          wwwAuthenticate: wwwAuth,
          responseBody: responseText.substring(0, 500),
          username: cleanUsername,
          passwordLength: cleanPassword.length,
          serverUrl: this.config.serverUrl
        });
        
        let errorMsg = 'Authentication failed. ';
        
        // Check for common issues
        const originalPassword = this.config.password?.trim() || '';
        if (originalPassword.includes(' ')) {
          errorMsg += 'The password appears to contain spaces. App-Specific Passwords should not have spaces. ';
        }
        
        if (cleanPassword.length < 16) {
          errorMsg += `The password seems too short (${cleanPassword.length} characters). App-Specific Passwords are typically 16+ characters. `;
        }
        
        // Check if username looks like an email
        if (!cleanUsername.includes('@')) {
          errorMsg += 'The username does not appear to be an email address. ';
        }
        
        errorMsg += '\n\nPlease verify:\n';
        errorMsg += '1. You are using an App-Specific Password (not your regular Apple ID password)\n';
        errorMsg += '2. The App-Specific Password was copied correctly (no extra spaces before or after)\n';
        errorMsg += '3. The username is your full Apple ID email address (the one you use to sign in to iCloud)\n';
        errorMsg += '4. The App-Specific Password hasn\'t been revoked (check appleid.apple.com)\n';
        errorMsg += '5. If using a non-iCloud email (like @yahoo.com, @gmail.com), make sure it\'s your Apple ID email\n';
        errorMsg += '\nTo generate a NEW App-Specific Password:\n';
        errorMsg += '1. Go to appleid.apple.com\n';
        errorMsg += '2. Sign in with your Apple ID\n';
        errorMsg += '3. Go to Sign-In and Security → App-Specific Passwords\n';
        errorMsg += '4. Click "Generate an app-specific password"\n';
        errorMsg += '5. Copy the ENTIRE password (format: xxxx-xxxx-xxxx-xxxx)\n';
        errorMsg += '6. Paste it here (the system will automatically remove any spaces)';
        
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // 200, 207 (Multi-Status), or 405 (Method Not Allowed) are all acceptable
      if (response.ok || response.status === 207 || response.status === 405) {
        console.log('✅ Authentication test passed');
        return { success: true };
      }
      
      // For other status codes, log them but still try to proceed
      console.log('⚠️ Authentication test returned unexpected status:', response.status);
      return { success: true };
    } catch (error) {
      console.error('❌ Authentication test error:', error);
      // If the test fails with a network error, provide helpful info
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return {
            success: false,
            error: `Network error: ${error.message}. Please check your internet connection and that the server URL (${this.config.serverUrl}) is correct.`
          };
        }
      }
      // Otherwise, we'll still try to proceed with the actual request
      return { success: true };
    }
  }

  async getEvents(startDate?: Date, endDate?: Date): Promise<{ success: boolean; events?: AppleCalendarEvent[]; error?: string }> {
    try {
      console.log('🍎 Fetching Apple Calendar events...');
      console.log('🍎 Server URL:', this.config.serverUrl);
      console.log('🍎 Username:', this.config.username);
      console.log('🍎 Calendar Path:', this.config.calendarPath);
      
      // First, test authentication with a simple request to the root
      const authTestResult = await this.testAuthentication();
      if (!authTestResult.success) {
        return {
          success: false,
          error: authTestResult.error || 'Authentication failed. Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password.'
        };
      }
      
      // Always try to discover the calendar URL first for better reliability
      let calendarUrl: string;
      
      // If calendar path is just /calendars or empty, discover the actual calendar URL
      if (!this.config.calendarPath || 
          this.config.calendarPath === '/calendars' || 
          this.config.calendarPath.endsWith('/calendars') ||
          this.config.calendarPath === '/') {
        console.log('🔍 Calendar path is generic, attempting discovery...');
        const discoveredUrl = await this.discoverCalendarUrl();
        if (discoveredUrl) {
          calendarUrl = discoveredUrl;
        } else {
          // Fallback: try common iCloud calendar paths
          calendarUrl = `${this.config.serverUrl}/calendars/users/${encodeURIComponent(this.config.username)}/calendar/`;
        }
      } else {
        // Use the provided path
        calendarUrl = `${this.config.serverUrl}${this.config.calendarPath}`;
      }
      
      // Ensure calendar URL ends with /
      if (!calendarUrl.endsWith('/')) {
        calendarUrl += '/';
      }
      
      console.log('🍎 Using calendar URL:', calendarUrl);
      
      // Get cleaned credentials for all requests
      const { username: cleanUsername, password: cleanPassword } = this.getCleanedCredentials();
      
      // First, try a simple PROPFIND to verify the calendar exists
      try {
        const propfindResponse = await fetch(calendarUrl, {
          method: 'PROPFIND',
          headers: {
            'Content-Type': 'application/xml',
            'Depth': '0',
            'Authorization': `Basic ${Buffer.from(`${cleanUsername}:${cleanPassword}`).toString('base64')}`,
            'User-Agent': 'Concierge-AI-Calendar/1.0'
          },
          body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname/>
    <C:calendar-description/>
  </D:prop>
</D:propfind>`
        });

        const propfindResponseText = await propfindResponse.text().catch(() => '');
        console.log('🔍 PROPFIND response status:', propfindResponse.status, propfindResponse.statusText);
        console.log('🔍 PROPFIND response body:', propfindResponseText.substring(0, 500));
        
        if (propfindResponse.status === 401 || propfindResponse.status === 403) {
          const wwwAuth = propfindResponse.headers.get('WWW-Authenticate');
          console.error('❌ PROPFIND authentication failed:', {
            status: propfindResponse.status,
            wwwAuthenticate: wwwAuth,
            responseBody: propfindResponseText.substring(0, 200)
          });
          return {
            success: false,
            error: 'Authentication failed. Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords to generate one.'
          };
        }
        
        if (!propfindResponse.ok && propfindResponse.status === 404) {
          // Calendar doesn't exist at this path, try discovery again
          console.log('⚠️ Calendar not found at path, trying alternative discovery...');
          const altUrl = await this.discoverCalendarUrl();
          if (altUrl && altUrl !== calendarUrl) {
            calendarUrl = altUrl;
            console.log('🔄 Using alternative calendar URL:', calendarUrl);
          }
        } else if (!propfindResponse.ok && propfindResponse.status === 400) {
          // 400 might indicate authentication issue or wrong path
          console.error('❌ PROPFIND 400 error:', propfindResponseText.substring(0, 500));
          // Check if it's actually an auth error
          const lowerErrorText = propfindResponseText.toLowerCase();
          if (lowerErrorText.includes('auth') || lowerErrorText.includes('unauthorized') || lowerErrorText.includes('credential')) {
            return {
              success: false,
              error: 'Authentication failed (400 Bad Request). Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords to generate one.'
            };
          }
          // Continue to try REPORT anyway, but we'll handle the error there
        }
      } catch (propfindError) {
        console.log('⚠️ PROPFIND check failed:', propfindError);
        // Continue with REPORT attempt
      }

      // Try REPORT query to fetch events
      const caldavQuery = this.createCalDAVQuery(startDate, endDate);
      console.log('📋 CalDAV Query:', caldavQuery.substring(0, 300));
      
      const response = await fetch(calendarUrl, {
        method: 'REPORT',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Depth': '1',
          'Authorization': `Basic ${Buffer.from(`${cleanUsername}:${cleanPassword}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: caldavQuery
      });

      const responseText = await response.text().catch(() => '');
      
      if (response.ok || response.status === 207) {
        // 207 Multi-Status is also a valid response for CalDAV
        const events = await this.parseCalDAVResponse(responseText);
        console.log(`✅ Found ${events.length} Apple Calendar events`);
        
        return {
          success: true,
          events: events
        };
      } else {
        console.error('❌ CalDAV REPORT error response:', response.status, response.statusText);
        console.error('❌ Error details:', responseText.substring(0, 500));
        console.error('❌ Calendar URL used:', calendarUrl);
        console.error('❌ Query sent:', caldavQuery.substring(0, 300));
        
        // For 400 errors, try a simpler query or different approach
        if (response.status === 400) {
          console.log('🔄 Trying alternative calendar discovery for 400 error...');
          
          // Try to discover the calendar URL again with a different approach
          const discoveredUrl = await this.discoverCalendarUrl();
          if (discoveredUrl && discoveredUrl !== calendarUrl) {
            console.log('🔄 Retrying with discovered URL:', discoveredUrl);
            
            // Try again with the discovered URL
            const retryResponse = await fetch(discoveredUrl, {
              method: 'REPORT',
              headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Depth': '1',
                'Authorization': `Basic ${Buffer.from(`${cleanUsername}:${cleanPassword}`).toString('base64')}`,
                'User-Agent': 'Concierge-AI-Calendar/1.0'
              },
              body: caldavQuery
            });
            
            if (retryResponse.ok || retryResponse.status === 207) {
              const retryText = await retryResponse.text().catch(() => '');
              const events = await this.parseCalDAVResponse(retryText);
              console.log(`✅ Found ${events.length} Apple Calendar events with discovered URL`);
              
              return {
                success: true,
                events: events
              };
            }
          }
          
          // If still failing, provide helpful error message
          const lowerErrorText = responseText.toLowerCase();
          let errorMessage = `Failed to fetch events: ${response.status} ${response.statusText}`;
          
          if (lowerErrorText.includes('auth') || lowerErrorText.includes('unauthorized') || lowerErrorText.includes('credential')) {
            errorMessage = 'Authentication failed. Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords to generate one.';
          } else {
            errorMessage += '. The calendar path may be incorrect or the CalDAV query format is invalid.';
            errorMessage += '\n\n💡 Tip: Try leaving the calendar path as "/calendars" to let the system discover the correct path automatically.';
            errorMessage += '\n\nIf the issue persists, the calendar may need to be accessed via a different path. Check your iCloud calendar settings.';
          }
          
          if (responseText && !errorMessage.includes(responseText.substring(0, 100))) {
            errorMessage += `\n\nDetails: ${responseText.substring(0, 200)}`;
          }
          
          return {
            success: false,
            error: errorMessage
          };
        } else if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: 'Authentication failed. Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords to generate one.'
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: `Calendar not found at the specified path: ${calendarUrl}\n\n💡 Tip: Try leaving the calendar path as "/calendars" to let the system discover the correct path automatically.`
          };
        }
        
        return {
          success: false,
          error: `Failed to fetch events: ${response.status} ${response.statusText}. ${responseText.substring(0, 200)}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events'
      };
    }
  }

  private async discoverCalendarUrl(): Promise<string | null> {
    try {
      console.log('🔍 Attempting to discover calendar URL...');
      
      // Try multiple discovery methods
      const discoveryPaths = [
        `/calendars/users/${encodeURIComponent(this.config.username)}/calendar/`,
        `/calendars/users/${encodeURIComponent(this.config.username)}/`,
        `/calendars/`,
        `/`
      ];

      // Get cleaned credentials for discovery
      const { username, password } = this.getCleanedCredentials();
      
      // First, try PROPFIND on /calendars/ to discover available calendars
      try {
        const discoveryUrl = `${this.config.serverUrl}/calendars/`;
        console.log('🔍 Trying PROPFIND on:', discoveryUrl);
        
        const propfindResponse = await fetch(discoveryUrl, {
          method: 'PROPFIND',
          headers: {
            'Content-Type': 'application/xml',
            'Depth': '1',
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'User-Agent': 'Concierge-AI-Calendar/1.0'
          },
          body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname/>
    <C:calendar-description/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`
        });

        console.log('🔍 PROPFIND discovery response:', propfindResponse.status, propfindResponse.statusText);
        
        if (propfindResponse.status === 401 || propfindResponse.status === 403) {
          console.error('❌ Authentication failed during calendar discovery');
          return null;
        }

        if (propfindResponse.ok) {
          const xml = await propfindResponse.text();
          console.log('📋 PROPFIND response received, parsing...');
          console.log('📋 Response preview:', xml.substring(0, 500));
          
          // Try to extract calendar URLs from the XML response
          // Look for href attributes in the response
          const hrefMatches = xml.match(/<D:href>([^<]+)<\/D:href>/g);
          if (hrefMatches && hrefMatches.length > 0) {
            console.log('📋 Found', hrefMatches.length, 'href matches');
            // Find the first calendar URL (usually the default calendar)
            for (const match of hrefMatches) {
              const href = match.replace(/<\/?D:href>/g, '');
              console.log('📋 Checking href:', href);
              if (href.includes('calendar') && !href.includes('principals')) {
                const calendarUrl = href.startsWith('http') ? href : `${this.config.serverUrl}${href}`;
                console.log('✅ Discovered calendar URL:', calendarUrl);
                return calendarUrl.endsWith('/') ? calendarUrl : `${calendarUrl}/`;
              }
            }
          }
        } else {
          console.log('⚠️ PROPFIND discovery returned status:', propfindResponse.status);
        }
      } catch (propfindError) {
        console.log('⚠️ PROPFIND discovery failed:', propfindError);
      }

      // If PROPFIND didn't work, try direct paths
      for (const path of discoveryPaths) {
        try {
          const testUrl = `${this.config.serverUrl}${path}`;
          console.log(`🔍 Testing path: ${testUrl}`);
          
          const testResponse = await fetch(testUrl, {
            method: 'OPTIONS',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'User-Agent': 'Concierge-AI-Calendar/1.0'
            }
          });

          if (testResponse.ok || testResponse.status === 405) {
            // 405 Method Not Allowed is OK - it means the endpoint exists
            console.log(`✅ Found working calendar path: ${path}`);
            return testUrl.endsWith('/') ? testUrl : `${testUrl}/`;
          }
        } catch (error) {
          // Continue to next path
          continue;
        }
      }

      // Fallback to the most common iCloud path
      const fallbackUrl = `${this.config.serverUrl}/calendars/users/${encodeURIComponent(this.config.username)}/calendar/`;
      console.log('⚠️ Using fallback calendar URL:', fallbackUrl);
      return fallbackUrl;
    } catch (error) {
      console.error('❌ Calendar discovery error:', error);
      // Return fallback URL even on error
      return `${this.config.serverUrl}/calendars/users/${encodeURIComponent(this.config.username)}/calendar/`;
    }
  }

  private createCalDAVQuery(startDate?: Date, endDate?: Date): string {
    // Use a date range for the query (last 30 days to next 30 days if not specified)
    const queryStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const queryEnd = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const start = this.formatCalDAVDate(queryStart);
    const end = this.formatCalDAVDate(queryEnd);
    
    return `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${start}" end="${end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
  }

  private async parseCalDAVResponse(responseText: string): Promise<AppleCalendarEvent[]> {
    // This is a simplified parser - in production, you'd want a proper CalDAV parser
    const events: AppleCalendarEvent[] = [];
    
    // Basic parsing logic here
    // In a real implementation, you'd parse the CalDAV XML response
    
    return events;
  }

  async updateEvent(eventId: string, event: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { username, password } = this.getCleanedCredentials();
      console.log('🍎 Updating Apple Calendar event:', eventId);
      
      const caldavEvent = this.createCalDAVEvent(event, eventId);
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${eventId}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: caldavEvent
      });

      if (response.ok) {
        console.log('✅ Apple Calendar event updated:', eventId);
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to update event: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { username, password } = this.getCleanedCredentials();
      console.log('🍎 Deleting Apple Calendar event:', eventId);
      
      const eventUrl = `${this.config.serverUrl}${this.config.calendarPath}/${eventId}.ics`;
      
      const response = await fetch(eventUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        }
      });

      if (response.ok) {
        console.log('✅ Apple Calendar event deleted:', eventId);
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to delete event: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Apple Calendar delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }
}
