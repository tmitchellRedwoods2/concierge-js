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

    // Mock successful account connection for demo purposes
    const mockInstitutionName = institution_name || 'Demo Bank';
    const mockAccounts = [
      {
        _id: `mock_account_${Date.now()}_1`,
        userId: session.user.id,
        plaidAccountId: `mock_plaid_${Date.now()}_1`,
        plaidItemId: `mock_item_${Date.now()}`,
        institutionName: mockInstitutionName,
        accountName: `${mockInstitutionName} Checking`,
        accountType: 'depository',
        accountSubtype: 'checking',
        mask: Math.floor(Math.random() * 9000) + 1000,
        balance: {
          available: Math.floor(Math.random() * 50000) + 1000,
          current: Math.floor(Math.random() * 50000) + 1000,
          iso_currency_code: 'USD'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    return NextResponse.json({
      success: true,
      accounts: mockAccounts,
      message: `Successfully connected 1 account to ${mockInstitutionName}`,
      mock: true
    });
  } catch (error) {
    console.error('Exchange token error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
