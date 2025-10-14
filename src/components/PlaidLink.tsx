'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Link, AlertCircle } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  linkToken: string | null;
  loading: boolean;
}

export default function PlaidLink({ onSuccess, onError, linkToken, loading }: PlaidLinkProps) {
  // Mock Plaid integration for demo purposes
  const handleMockConnection = async () => {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful connection
    const mockPublicToken = `public-sandbox-${Date.now()}`;
    const mockMetadata = {
      institution: {
        institution_id: 'mock_institution_123',
        name: 'Demo Bank'
      },
      accounts: [
        {
          id: 'mock_account_123',
          name: 'Demo Bank Checking',
          type: 'depository',
          subtype: 'checking',
          mask: '1234'
        }
      ]
    };
    
    onSuccess(mockPublicToken, mockMetadata);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Connect Bank Account
        </CardTitle>
        <CardDescription>
          Securely connect your bank account to track expenses automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            🎭 <strong>Demo Mode:</strong> This will simulate connecting to a bank account
          </p>
        </div>
        
        <Button
          onClick={handleMockConnection}
          className="w-full"
          size="lg"
        >
          <Link className="h-4 w-4 mr-2" />
          Connect Demo Bank Account
        </Button>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Bank-level security</p>
          <p>🔐 Read-only access</p>
          <p>⚡ Instant setup</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConnectedAccountCardProps {
  account: {
    _id: string;
    name: string;
    type: string;
    subtype: string;
    mask: string;
    balances: {
      current: number | null;
      available: number | null;
    };
  };
  onDisconnect: (accountId: string) => void;
}

export function ConnectedAccountCard({ account, onDisconnect }: ConnectedAccountCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    if (typeof window === 'undefined') return `$${amount?.toFixed(2) || '0.00'}`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    if (!type || typeof type !== 'string') return '💰';
    switch (type.toLowerCase()) {
      case 'depository':
        return '🏦';
      case 'credit':
        return '💳';
      case 'loan':
        return '🏠';
      case 'investment':
        return '📈';
      default:
        return '💰';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
            <div>
              <CardTitle className="text-lg">{account.name || 'Unknown Account'}</CardTitle>
              <CardDescription className="capitalize">
                {account.subtype || 'account'} •••• {account.mask || '****'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(account._id || '')}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Disconnect
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-lg font-semibold">
              {formatCurrency(account.balances?.current)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-lg font-semibold">
              {formatCurrency(account.balances?.available)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
