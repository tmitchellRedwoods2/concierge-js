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
  static getAuthUrl(userId: string): string {
    // Determine the base URL - remove trailing slash if present
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  'http://localhost:3000';
    
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const redirectUri = `${baseUrl}/api/email/oauth/gmail/callback`;
    
    console.log('🔗 Gmail OAuth redirect URI:', redirectUri);
    console.log('🔗 Base URL (after cleanup):', baseUrl);
    console.log('🔗 NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🔗 VERCEL_URL:', process.env.VERCEL_URL);
    console.log('🔗 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');

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
    let baseUrl: string;
    
    if (requestUrl) {
      const url = new URL(requestUrl);
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                'http://localhost:3000';
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
    } catch (error) {
      console.error('Error refreshing Gmail access token:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchEmails(lastMessageId?: string, maxResults: number = 10): Promise<PolledEmail[]> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Build query to fetch new messages
      let query = 'in:inbox';
      if (lastMessageId) {
        // Use Gmail's search to find messages after a specific message ID
        // Note: Gmail uses internal IDs, so we'll use a timestamp-based approach
        query += ` after:${Math.floor(Date.now() / 1000) - 3600}`; // Last hour as fallback
      }

      // List messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const emails: PolledEmail[] = [];

      // Fetch full message details
      for (const message of messages) {
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const email = this.parseGmailMessage(messageDetail.data);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }

      return emails;
    } catch (error: any) {
      if (error.code === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        // Retry once
        return this.fetchEmails(lastMessageId, maxResults);
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

