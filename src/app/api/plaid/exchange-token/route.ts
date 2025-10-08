import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exchangePublicToken, getAccounts } from '@/lib/plaid';
import { connectToDatabase } from '@/lib/db/connection';
import Account from '@/lib/db/models/Account';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { public_token, institution_id, institution_name } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const { access_token, item_id } = await exchangePublicToken(public_token);
    
    // Get accounts from Plaid
    const accounts = await getAccounts(access_token);
    
    // Connect to database
    await connectToDatabase();
    
    // Save accounts to database
    const savedAccounts = [];
    
    for (const account of accounts) {
      const existingAccount = await Account.findOne({
        plaidAccountId: account.account_id,
      });
      
      if (!existingAccount) {
        const newAccount = new Account({
          userId: session.user.id,
          plaidAccountId: account.account_id,
          plaidItemId: item_id,
          accessToken: access_token,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balances: {
            available: account.balances.available,
            current: account.balances.current,
            limit: account.balances.limit,
          },
          lastSync: new Date(),
        });
        
        await newAccount.save();
        savedAccounts.push(newAccount);
      }
    }
    
    return NextResponse.json({
      success: true,
      accounts: savedAccounts,
      message: `Successfully connected ${savedAccounts.length} account(s)`,
    });
  } catch (error) {
    console.error('Exchange token error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
