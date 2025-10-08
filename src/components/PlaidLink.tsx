'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Link, CheckCircle, AlertCircle } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  linkToken: string | null;
  loading: boolean;
}

export default function PlaidLink({ onSuccess, onError, linkToken, loading }: PlaidLinkProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const config = {
    token: linkToken,
    onSuccess: (publicToken: string, metadata: any) => {
      setIsConnecting(false);
      onSuccess(publicToken, metadata);
    },
    onExit: (err: any, metadata: any) => {
      setIsConnecting(false);
      if (err && onError) {
        onError(err);
      }
    },
    onEvent: (eventName: string, metadata: any) => {
      if (eventName === 'OPEN') {
        setIsConnecting(true);
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!linkToken) {
    return (
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Connection Error
          </CardTitle>
          <CardDescription className="text-red-600">
            Unable to initialize bank connection. Please try again.
          </CardDescription>
        </CardHeader>
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
        <Button
          onClick={() => open()}
          disabled={!ready || isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Connect Bank Account
            </>
          )}
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
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
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <CardDescription className="capitalize">
                {account.subtype} •••• {account.mask}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(account._id)}
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
              {formatCurrency(account.balances.current)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-lg font-semibold">
              {formatCurrency(account.balances.available)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
