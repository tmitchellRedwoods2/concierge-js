import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Account from '@/lib/db/models/Account';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock connected accounts for demo purposes
    const mockAccounts = [
      {
        _id: 'mock_account_1',
        userId: session.user.id,
        plaidAccountId: 'mock_plaid_1',
        institutionName: 'Chase Bank',
        name: 'Chase Total Checking',
        type: 'depository',
        subtype: 'checking',
        mask: '1234',
        balances: {
          available: 2456.78,
          current: 2456.78,
          iso_currency_code: 'USD'
        },
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        _id: 'mock_account_2',
        userId: session.user.id,
        plaidAccountId: 'mock_plaid_2',
        institutionName: 'Bank of America',
        name: 'Bank of America Cash Rewards Credit Card',
        type: 'credit',
        subtype: 'credit card',
        mask: '5678',
        balances: {
          available: 5000.00,
          current: 1234.56,
          iso_currency_code: 'USD'
        },
        isActive: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date()
      },
      {
        _id: 'mock_account_3',
        userId: session.user.id,
        plaidAccountId: 'mock_plaid_3',
        institutionName: 'Wells Fargo',
        name: 'Wells Fargo Savings',
        type: 'depository',
        subtype: 'savings',
        mask: '9012',
        balances: {
          available: 15750.25,
          current: 15750.25,
          iso_currency_code: 'USD'
        },
        isActive: true,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date()
      }
    ];
    
    return NextResponse.json({ 
      accounts: mockAccounts,
      mock: true,
      message: 'Mock accounts data'
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to get accounts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const account = await Account.findOneAndUpdate(
      {
        _id: accountId,
        userId: session.user.id,
      },
      { isActive: false },
      { new: true }
    );
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
