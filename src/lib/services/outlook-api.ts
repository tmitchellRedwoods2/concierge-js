import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { PolledEmail } from './email-polling';

export interface OutlookCredentials {
  accessToken: string;
  refreshToken: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export class OutlookAPIService {
  private msalClient: ConfidentialClientApplication;
  private graphClient: Client | null = null;
  private credentials: OutlookCredentials;

  constructor(credentials: OutlookCredentials) {
    this.credentials = credentials;

    // Initialize MSAL client
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: credentials.clientId || process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: credentials.clientSecret || process.env.MICROSOFT_CLIENT_SECRET || '',
        authority: `https://login.microsoftonline.com/${credentials.tenantId || process.env.MICROSOFT_TENANT_ID || 'common'}`
      }
    });

    // Initialize Graph client with custom authentication
    // We'll use a custom authentication approach that provides the access token
    this.graphClient = Client.init({
      authProvider: {
        getAccessToken: async () => {
          return await this.getAccessToken();
        }
      } as any
    });
  }

  /**
   * Get OAuth2 authorization URL for Outlook
   */
  static getAuthUrl(userId: string): string {
    const clientId = process.env.MICROSOFT_CLIENT_ID || '';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/oauth/outlook/callback`;
    const scopes = ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.ReadWrite'];
    const state = userId;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      response_mode: 'query'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code: string): Promise<OutlookCredentials> {
    const clientId = process.env.MICROSOFT_CLIENT_ID || '';
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/oauth/outlook/callback`;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

    const msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`
      }
    });

    try {
      const result: AuthenticationResult = await msalClient.acquireTokenByCode({
        code,
        redirectUri,
        scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.ReadWrite']
      });

      return {
        accessToken: result.accessToken,
        refreshToken: result.account?.idTokenClaims?.refresh_token || '', // Note: MSAL handles refresh differently
        tenantId,
        clientId,
        clientSecret
      };
    } catch (error) {
      console.error('Error exchanging Outlook code for tokens:', error);
      throw error;
    }
  }

  /**
   * Get access token (refresh if needed)
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Try to use existing token first
      if (this.credentials.accessToken) {
        // In a real implementation, check if token is expired
        // For now, we'll try to use it and refresh if it fails
        return this.credentials.accessToken;
      }

      // Refresh token
      const result = await this.msalClient.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.ReadWrite'],
        account: null as any // MSAL will use cached account
      });

      if (result) {
        this.credentials.accessToken = result.accessToken;
        return result.accessToken;
      }

      throw new Error('Failed to acquire token');
    } catch (error) {
      console.error('Error getting Outlook access token:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from Outlook
   */
  async fetchEmails(lastMessageId?: string, maxResults: number = 10): Promise<PolledEmail[]> {
    try {
      if (!this.graphClient) {
        throw new Error('Graph client not initialized');
      }

      // Build filter query
      let filter = '';
      if (lastMessageId) {
        // Use receivedDateTime to filter new messages
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        filter = `receivedDateTime ge ${oneHourAgo}`;
      }

      // Fetch messages
      const response = await this.graphClient
        .api('/me/messages')
        .filter(filter)
        .top(maxResults)
        .orderby('receivedDateTime desc')
        .select('id,subject,from,toRecipients,body,receivedDateTime,internetMessageId')
        .get();

      const messages = response.value || [];
      const emails: PolledEmail[] = [];

      for (const message of messages) {
        try {
          const email = this.parseOutlookMessage(message);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`Error parsing message ${message.id}:`, error);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching Outlook emails:', error);
      throw error;
    }
  }

  /**
   * Parse Outlook message format to PolledEmail
   */
  private parseOutlookMessage(message: any): PolledEmail | null {
    try {
      const from = message.from?.emailAddress?.address || '';
      const to = message.toRecipients?.[0]?.emailAddress?.address || '';
      const subject = message.subject || '';
      const body = message.body?.content || '';
      const date = message.receivedDateTime ? new Date(message.receivedDateTime) : new Date();
      const messageId = message.internetMessageId || message.id;

      return {
        id: message.id,
        from: from,
        to: to,
        subject: subject,
        body: body,
        date: date,
        messageId: messageId
      };
    } catch (error) {
      console.error('Error parsing Outlook message:', error);
      return null;
    }
  }

  /**
   * Get updated credentials
   */
  getCredentials(): OutlookCredentials {
    return { ...this.credentials };
  }
}

