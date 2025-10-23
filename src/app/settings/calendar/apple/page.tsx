'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AppleCalendarSetupPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({
    serverUrl: 'https://caldav.icloud.com',
    username: '',
    password: '',
    calendarPath: '/calendars'
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/calendar/apple/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarPreferences: {
            primaryProvider: 'apple',
            syncEnabled: true,
            appleCalendarConfig: config
          }
        })
      });

      if (response.ok) {
        alert('Apple Calendar configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Apple Calendar Setup</h1>
            <p className="text-blue-100 mt-1">Configure your Apple Calendar integration</p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Setup Instructions</h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>1. Go to <strong>System Preferences → Internet Accounts</strong></p>
                  <p>2. Add your Apple ID account</p>
                  <p>3. Enable Calendar sync</p>
                  <p>4. Use your Apple ID credentials below</p>
                </div>
              </div>

              {/* Configuration Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server URL
                  </label>
                  <input
                    type="text"
                    value={config.serverUrl}
                    onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://caldav.icloud.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: https://caldav.icloud.com (for iCloud)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apple ID (Username)
                  </label>
                  <input
                    type="email"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-apple-id@icloud.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Apple ID password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We recommend using an App-Specific Password for security
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calendar Path
                  </label>
                  <input
                    type="text"
                    value={config.calendarPath}
                    onChange={(e) => setConfig({ ...config, calendarPath: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/calendars"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: /calendars (for iCloud)
                  </p>
                </div>
              </div>

              {/* Test Connection */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !config.username || !config.password}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-md ${
                    testResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!testResult?.success}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Apple Calendar Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
