import { google } from 'googleapis';
import { PolledEmail } from './email-polling';

export interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
}

export class GmailAPIService {
  private oauth2Client: any;
  private credentials: GmailCredentials;

  constructor(credentials: GmailCredentials) {
    this.credentials = credentials;
    
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId || process.env.GOOGLE_CLIENT_ID,
      credentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/oauth/gmail/callback`
    );

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });

    // Auto-refresh token if expired
    this.oauth2Client.on('tokens', (tokens: any) => {
      if (tokens.refresh_token) {
        this.credentials.refreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        this.credentials.accessToken = tokens.access_token;
      }
    });
  }

  /**
   * Get OAuth2 authorization URL for Gmail
   */
  static getAuthUrl(userId: string, requestUrl?: string): string {
    // Determine the base URL - prioritize production URL from env vars to avoid redirect_uri_mismatch
    // This ensures OAuth works consistently even with Vercel preview deployments
    let baseUrl: string;
    
    // Priority 1: Use production URL from environment variable (most reliable)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    // Priority 2: Use request URL (for localhost or when NEXT_PUBLIC_APP_URL not set)
    else if (requestUrl) {
      const url = new URL(requestUrl);
      baseUrl = `${url.protocol}//${url.host}`;
    }
    // Priority 3: Fallback to VERCEL_URL or localhost
    else {
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    }
    
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const redirectUri = `${baseUrl}/api/email/oauth/gmail/callback`;
    
    // Log detailed information for debugging
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 Gmail OAuth Configuration:');
    console.log('   Redirect URI:', redirectUri);
    console.log('   Base URL:', baseUrl);
    console.log('   Request URL:', requestUrl);
    console.log('   NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '(not set)');
    console.log('   VERCEL_URL:', process.env.VERCEL_URL || '(not set)');
    console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Make sure this redirect URI is added to Google Cloud Console:');
    console.log('   ', redirectUri);
    console.log('═══════════════════════════════════════════════════════');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId in state for callback
      redirect_uri: redirectUri // Explicitly include redirect_uri
    });

    console.log('🔗 Generated auth URL:', authUrl.substring(0, 100) + '...');
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code: string, requestUrl?: string): Promise<GmailCredentials & { emailAddress?: string }> {
    // Determine the base URL (must match the one used in getAuthUrl)
    // Use the same priority logic as getAuthUrl to ensure consistency
    let baseUrl: string;
    
    // Priority 1: Use production URL from environment variable (most reliable)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    // Priority 2: Use request URL (for localhost or when NEXT_PUBLIC_APP_URL not set)
    else if (requestUrl) {
      const url = new URL(requestUrl);
      baseUrl = `${url.protocol}//${url.host}`;
    }
    // Priority 3: Fallback to VERCEL_URL or localhost
    else {
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    }
    
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/email/oauth/gmail/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);
    
    // Fetch user's email address from Gmail API
    let emailAddress: string | undefined;
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      emailAddress = profile.data.emailAddress || undefined;
      console.log('📧 Fetched Gmail address:', emailAddress);
    } catch (error) {
      console.error('⚠️ Could not fetch Gmail address:', error);
      // Continue without email address - it can be updated later
    }
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      emailAddress
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.credentials.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        this.credentials.refreshToken = credentials.refresh_token;
      }
      return credentials.access_token;
    } catch (error: any) {
      // Check for invalid_grant error specifically
      if (error.message?.includes('invalid_grant') || error.code === 'invalid_grant') {
        console.error('❌ Gmail OAuth Error: invalid_grant during token refresh');
        console.error('   The refresh token is invalid, expired, or has been revoked.');
        console.error('   User needs to reconnect Gmail account.');
        throw new Error('Gmail authentication expired. Please reconnect your Gmail account in Settings → Email Scanning.');
      }
      console.error('Error refreshing Gmail access token:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchEmails(lastMessageId?: string, maxResults: number = 10, hoursBack: number = 24): Promise<PolledEmail[]> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Build query to fetch new messages
      let query = 'in:inbox';
      // Use timestamp-based approach to find recent messages
      // For manual scans, use a longer time window (default 24 hours)
      const secondsBack = hoursBack * 3600;
      const timestamp = Math.floor(Date.now() / 1000) - secondsBack;
      query += ` after:${timestamp}`;
      
      // If lastMessageId is provided, we could use it, but for manual scans we ignore it
      // to allow re-scanning of older emails
      
      console.log(`📧 Gmail query: ${query} (looking back ${hoursBack} hours / ${Math.round(hoursBack/24)} days)`);
      if (lastMessageId) {
        console.log(`📧 Note: lastMessageId provided (${lastMessageId.substring(0, 20)}...), but using time-based query for broader scan`);
      }

      // List messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      console.log(`📧 Gmail API returned ${messages.length} message(s) for query: ${query}`);
      console.log(`📧 Query details: after:${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
      console.log(`📧 Current time: ${new Date().toISOString()}`);
      console.log(`📧 Time window: ${hoursBack} hours (${Math.round(hoursBack/24)} days)`);
      
      if (messages.length === 0) {
        console.log(`⚠️ No messages found. Query was: ${query}`);
        console.log(`⚠️ This might mean:`);
        console.log(`   1) No emails in inbox within the last ${hoursBack} hours`);
        console.log(`   2) Query syntax issue (timestamp: ${timestamp}, date: ${new Date(timestamp * 1000).toISOString()})`);
        console.log(`   3) Gmail API permissions issue`);
        console.log(`   4) All emails are archived/not in inbox`);
        console.log(`💡 Try: Check your Gmail inbox manually to see if there are emails in this time range`);
      } else {
        console.log(`✅ Found ${messages.length} message(s) - fetching details...`);
      }
      
      const emails: PolledEmail[] = [];

      // Fetch full message details
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        try {
          console.log(`📧 Fetching message ${i + 1}/${messages.length}: ${message.id}`);
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const email = this.parseGmailMessage(messageDetail.data);
          if (email) {
            console.log(`✅ Parsed email ${i + 1}: "${email.subject}" from ${email.from}`);
            emails.push(email);
          } else {
            console.log(`⚠️ Failed to parse email ${i + 1} (ID: ${message.id})`);
          }
        } catch (error) {
          console.error(`❌ Error fetching message ${message.id}:`, error);
        }
      }
      
      console.log(`📧 Successfully parsed ${emails.length} of ${messages.length} message(s)`);

      return emails;
    } catch (error: any) {
      // Check for invalid_grant error (refresh token is invalid/expired)
      if (error.message?.includes('invalid_grant') || error.code === 'invalid_grant') {
        console.error('❌ Gmail OAuth Error: invalid_grant');
        console.error('   This means the refresh token is invalid, expired, or revoked.');
        console.error('   The user needs to reconnect their Gmail account.');
        throw new Error('Gmail authentication expired. Please reconnect your Gmail account in Settings → Email Scanning.');
      }
      
      if (error.code === 401) {
        // Token expired, try to refresh
        try {
          await this.refreshAccessToken();
          // Retry once
          return this.fetchEmails(lastMessageId, maxResults, hoursBack);
        } catch (refreshError: any) {
          // If refresh also fails with invalid_grant, throw a user-friendly error
          if (refreshError.message?.includes('invalid_grant') || refreshError.code === 'invalid_grant') {
            throw new Error('Gmail authentication expired. Please reconnect your Gmail account in Settings → Email Scanning.');
          }
          throw refreshError;
        }
      }
      console.error('Error fetching Gmail emails:', error);
      throw error;
    }
  }

  /**
   * Parse Gmail message format to PolledEmail
   */
  private parseGmailMessage(message: any): PolledEmail | null {
    try {
      const headers = message.payload.headers || [];
      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      const from = getHeader('From');
      const to = getHeader('To');
      const subject = getHeader('Subject');
      const date = getHeader('Date');
      const messageId = getHeader('Message-ID');

      // Extract body
      let body = '';
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.parts) {
        // Try to find text/plain or text/html part
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
            // Use HTML as fallback
            const htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Strip HTML tags for plain text
            body = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
      }

      return {
        id: message.id,
        from: from,
        to: to,
        subject: subject,
        body: body,
        date: date ? new Date(date) : new Date(),
        messageId: messageId || message.id
      };
    } catch (error) {
      console.error('Error parsing Gmail message:', error);
      return null;
    }
  }

  /**
   * Get updated credentials (after token refresh)
   */
  getCredentials(): GmailCredentials {
    return { ...this.credentials };
  }
}

