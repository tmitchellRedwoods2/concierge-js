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
                    App-Specific Password
                  </label>
                  <input
                    type="password"
                    value={config.password}
                    onChange={(e) => {
                      // Remove any spaces that might have been accidentally added
                      const cleanedPassword = e.target.value.replace(/\s/g, '');
                      setConfig({ ...config, password: cleanedPassword });
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                  />
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-gray-500">
                      <strong>Important:</strong> You must use an App-Specific Password, not your regular Apple ID password. 
                      Regular passwords will not work with CalDAV.
                    </p>
                    {config.password && (
                      <div className={`p-2 rounded text-xs ${
                        config.password.includes(' ') 
                          ? 'bg-red-50 text-red-800 border border-red-200' 
                          : config.password.length < 16
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                          : 'bg-green-50 text-green-800 border border-green-200'
                      }`}>
                        {config.password.includes(' ') ? (
                          <p>⚠️ Warning: Password contains spaces. App-Specific Passwords should not have spaces.</p>
                        ) : config.password.length < 16 ? (
                          <p>⚠️ Warning: Password seems too short ({config.password.length} chars). App-Specific Passwords are typically 16+ characters.</p>
                        ) : (
                          <p>✅ Password format looks good ({config.password.length} characters, no spaces)</p>
                        )}
                      </div>
                    )}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 font-medium mb-1">How to create an App-Specific Password:</p>
                      <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
                        <li>Go to <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">appleid.apple.com</a></li>
                        <li>Sign in with your Apple ID</li>
                        <li>Go to <strong>Sign-In and Security</strong> → <strong>App-Specific Passwords</strong></li>
                        <li>Click <strong>Generate an app-specific password</strong></li>
                        <li>Enter a label (e.g., "Concierge Calendar") and click <strong>Create</strong></li>
                        <li>Copy the generated password (format: xxxx-xxxx-xxxx-xxxx) and paste it here</li>
                        <li><strong>Important:</strong> Copy the entire password without any spaces</li>
                      </ol>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium mb-1">Troubleshooting:</p>
                      <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                        <li>Make sure you're using your <strong>full Apple ID email address</strong> as the username</li>
                        <li>If you previously generated a password, try generating a <strong>new one</strong> (old ones may have been revoked)</li>
                        <li>Make sure there are <strong>no spaces</strong> before or after the password when pasting</li>
                        <li>App-Specific Passwords are case-sensitive - copy exactly as shown</li>
                      </ul>
                    </div>
                  </div>
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
                    Default: /calendars (for iCloud). For iCloud, the actual path is usually discovered automatically, but you can also try: /calendars/users/[your-apple-id]/calendar/
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    💡 Tip: If you get a 400 error, try leaving this as "/calendars" - the system will attempt to discover the correct path automatically.
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
