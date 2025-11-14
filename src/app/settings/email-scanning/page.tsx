'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, Plus, Trash2, Play, Pause, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface EmailAccount {
  _id: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  enabled: boolean;
  scanInterval: number;
  lastChecked?: string;
  createdAt: string;
}

export default function EmailScanningPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadAccounts();
      
      // Check for OAuth callback success/error
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const error = params.get('error');
      
      if (success) {
        alert(success === 'gmail_connected' ? 'Gmail connected successfully!' : 'Outlook connected successfully!');
        // Clean URL
        window.history.replaceState({}, '', '/settings/email-scanning');
        loadAccounts();
      }
      
      if (error) {
        alert(`Connection failed: ${error}`);
        // Clean URL
        window.history.replaceState({}, '', '/settings/email-scanning');
      }
    }
  }, [session]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/email/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading email accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = async (accountId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/email/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          enabled: !enabled
        })
      });

      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error toggling account:', error);
      alert('Failed to update account');
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this email account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/email/accounts?accountId=${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);

    const formData = new FormData(e.currentTarget);
    const emailAddress = formData.get('emailAddress') as string;
    const provider = formData.get('provider') as string;
    const scanInterval = parseInt(formData.get('scanInterval') as string) || 15;

    try {
      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailAddress,
          provider,
          scanInterval,
          enabled: true,
          credentials: {} // Will be configured via OAuth or manual setup
        })
      });

      if (response.ok) {
        await loadAccounts();
        setShowAddForm(false);
        e.currentTarget.reset();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add email account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add email account');
    } finally {
      setAdding(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading email scanning settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Autonomous Email Scanning
            </h1>
            <p className="text-blue-100 mt-1">
              Configure email accounts to automatically scan for appointments and create calendar events
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">🤖 How It Works</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Add your email accounts below</li>
                <li>The system continuously scans your inbox for appointment emails</li>
                <li>When an appointment is detected, a calendar event is automatically created</li>
                <li>Events are synced to your external calendar (if enabled)</li>
                <li>You receive a confirmation notification</li>
                <li><strong>No manual intervention required!</strong></li>
              </ul>
            </div>

            {/* Quick Connect Buttons */}
            {!showAddForm && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/email/oauth/gmail/authorize');
                        const data = await response.json();
                        if (data.success && data.authUrl) {
                          window.location.href = data.authUrl;
                        } else {
                          alert('Failed to initiate Gmail OAuth');
                        }
                      } catch (error) {
                        console.error('Error initiating Gmail OAuth:', error);
                        alert('Failed to connect Gmail');
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    Connect Gmail
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/email/oauth/outlook/authorize');
                        const data = await response.json();
                        if (data.success && data.authUrl) {
                          window.location.href = data.authUrl;
                        } else {
                          alert('Failed to initiate Outlook OAuth');
                        }
                      } catch (error) {
                        console.error('Error initiating Outlook OAuth:', error);
                        alert('Failed to connect Outlook');
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.5 11.5h9m-9 0a3 3 0 110-6h9a3 3 0 110 6m-9 0v9a3 3 0 003 3h3a3 3 0 003-3v-9m-6-9V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 3v2.5"/>
                    </svg>
                    Connect Outlook
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Or add email account manually
                  </button>
                </div>
              </div>
            )}

            {/* Add Account Form */}
            {showAddForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Email Account</h2>
                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="emailAddress"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your-email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Provider
                    </label>
                    <select
                      name="provider"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gmail">Gmail (OAuth)</option>
                      <option value="outlook">Outlook (OAuth)</option>
                      <option value="imap">IMAP (Manual Setup)</option>
                      <option value="exchange">Exchange (Manual Setup)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      For Gmail and Outlook, click "Connect with OAuth" below after selecting the provider.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scan Interval (minutes)
                    </label>
                    <input
                      type="number"
                      name="scanInterval"
                      min="5"
                      max="60"
                      defaultValue="15"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How often to check for new emails (5-60 minutes)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={adding}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Account
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Email Accounts List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Email Accounts</h2>
              
              {accounts.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No email accounts configured</p>
                  <p className="text-sm text-gray-500">
                    Add an email account above to start autonomous appointment detection
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-5 w-5 text-gray-500" />
                            <div>
                              <h3 className="font-medium text-gray-900">{account.emailAddress}</h3>
                              <p className="text-sm text-gray-500 capitalize">{account.provider}</p>
                            </div>
                            {account.enabled ? (
                              <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Pause className="h-4 w-4" />
                                Paused
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-500">Scan Interval:</span>
                              <span className="ml-2 text-gray-900">{account.scanInterval} minutes</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Last Checked:</span>
                              <span className="ml-2 text-gray-900">
                                {account.lastChecked
                                  ? new Date(account.lastChecked).toLocaleString()
                                  : 'Never'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleAccount(account._id, account.enabled)}
                            className={`p-2 rounded-md transition-colors ${
                              account.enabled
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={account.enabled ? 'Pause scanning' : 'Resume scanning'}
                          >
                            {account.enabled ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => loadAccounts()}
                            className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            title="Refresh status"
                          >
                            <RefreshCw className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteAccount(account._id)}
                            className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Summary */}
            {accounts.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Status Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Accounts:</span>
                    <span className="ml-2 font-medium text-gray-900">{accounts.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Active:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {accounts.filter(a => a.enabled).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Paused:</span>
                    <span className="ml-2 font-medium text-gray-600">
                      {accounts.filter(a => !a.enabled).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

