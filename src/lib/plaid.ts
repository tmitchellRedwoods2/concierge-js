import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Initialize Plaid client
function getPlaidClient() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
        'PLAID-SECRET': process.env.PLAID_SECRET || '',
      },
    },
  });

  return new PlaidApi(configuration);
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category: string[];
  category_id?: string;
  account_owner?: string;
}

export async function createLinkToken(userId: string) {
  try {
    const client = getPlaidClient();
    
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Concierge.js',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return response.data.link_token;
  } catch (error) {
    console.error('Plaid link token error:', error);
    throw new Error('Failed to create link token');
  }
}

export async function exchangePublicToken(publicToken: string) {
  try {
    const client = getPlaidClient();
    
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return response.data;
  } catch (error) {
    console.error('Plaid exchange token error:', error);
    throw new Error('Failed to exchange public token');
  }
}

export async function getAccounts(accessToken: string) {
  try {
    const client = getPlaidClient();
    
    const response = await client.accountsGet({
      access_token: accessToken,
    });

    return response.data.accounts;
  } catch (error) {
    console.error('Plaid get accounts error:', error);
    throw new Error('Failed to get accounts');
  }
}

export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const client = getPlaidClient();
    
    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
      },
    });

    return response.data.transactions;
  } catch (error) {
    console.error('Plaid get transactions error:', error);
    throw new Error('Failed to get transactions');
  }
}

export default getPlaidClient;
