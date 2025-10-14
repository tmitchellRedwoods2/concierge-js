import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock transaction data for demo purposes
    const mockTransactions = [
      {
        transaction_id: 'mock_txn_1',
        account_id: 'mock_account_1',
        amount: -45.67,
        date: '2024-01-15',
        name: 'STARBUCKS STORE #1234',
        merchant_name: 'Starbucks',
        category: ['Food and Drink', 'Restaurants'],
        subcategory: ['Coffee Shop'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_2',
        account_id: 'mock_account_1',
        amount: -89.99,
        date: '2024-01-14',
        name: 'AMAZON.COM',
        merchant_name: 'Amazon',
        category: ['Shops'],
        subcategory: ['General'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_3',
        account_id: 'mock_account_1',
        amount: -23.45,
        date: '2024-01-14',
        name: 'SHELL OIL',
        merchant_name: 'Shell',
        category: ['Gas Stations'],
        subcategory: ['Gas Stations'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_4',
        account_id: 'mock_account_1',
        amount: 3200.00,
        date: '2024-01-12',
        name: 'PAYROLL DEPOSIT',
        merchant_name: 'Employer',
        category: ['Transfer', 'Payroll'],
        subcategory: ['Payroll'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_5',
        account_id: 'mock_account_1',
        amount: -156.78,
        date: '2024-01-11',
        name: 'TARGET STORE',
        merchant_name: 'Target',
        category: ['Shops', 'Department Stores'],
        subcategory: ['Department Stores'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_6',
        account_id: 'mock_account_1',
        amount: -67.89,
        date: '2024-01-10',
        name: 'NETFLIX.COM',
        merchant_name: 'Netflix',
        category: ['Recreation', 'Entertainment'],
        subcategory: ['Streaming Services'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_7',
        account_id: 'mock_account_2',
        amount: -234.56,
        date: '2024-01-09',
        name: 'CHASE CREDIT CARD PAYMENT',
        merchant_name: 'Chase',
        category: ['Payment', 'Credit Card'],
        subcategory: ['Credit Card'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_8',
        account_id: 'mock_account_1',
        amount: -89.12,
        date: '2024-01-08',
        name: 'WHOLE FOODS MARKET',
        merchant_name: 'Whole Foods',
        category: ['Shops', 'Food and Drink'],
        subcategory: ['Grocery'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_9',
        account_id: 'mock_account_1',
        amount: -45.00,
        date: '2024-01-07',
        name: 'UBER TRIP',
        merchant_name: 'Uber',
        category: ['Transportation', 'Rideshare'],
        subcategory: ['Rideshare'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      },
      {
        transaction_id: 'mock_txn_10',
        account_id: 'mock_account_1',
        amount: -123.45,
        date: '2024-01-06',
        name: 'APPLE.COM',
        merchant_name: 'Apple',
        category: ['Shops', 'Electronics'],
        subcategory: ['Electronics'],
        account_owner: session.user.id,
        iso_currency_code: 'USD',
        pending: false
      }
    ];

    // Filter by date range if provided
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let filteredTransactions = mockTransactions;
    
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(txn => txn.date >= startDate);
    }
    
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(txn => txn.date <= endDate);
    }

    return NextResponse.json({
      transactions: filteredTransactions,
      total_transactions: filteredTransactions.length,
      accounts: [
        { account_id: 'mock_account_1', name: 'Chase Total Checking' },
        { account_id: 'mock_account_2', name: 'Bank of America Credit Card' }
      ],
      mock: true,
      message: 'Mock transaction data'
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get transactions' },
      { status: 500 }
    );
  }
}
