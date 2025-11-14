'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CalendarPreferences {
  primaryProvider: 'internal' | 'google' | 'outlook' | 'apple' | 'caldav';
  syncEnabled: boolean;
  syncDirection: 'internal-to-external' | 'external-to-internal' | 'bidirectional';
  externalCalendarId?: string;
  externalCalendarName?: string;
  syncSettings: {
    autoSync: boolean;
    syncInterval: number;
    syncOnCreate: boolean;
    syncOnUpdate: boolean;
    syncOnDelete: boolean;
  };
}

export default function CalendarSettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<CalendarPreferences>({
    primaryProvider: 'internal',
    syncEnabled: false,
    syncDirection: 'internal-to-external',
    syncSettings: {
      autoSync: true,
      syncInterval: 15,
      syncOnCreate: true,
      syncOnUpdate: true,
      syncOnDelete: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPreferences();
    }
  }, [session]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats: { preferences: {...} } or { calendarPreferences: {...} }
        const prefs = data.preferences?.calendarPreferences || data.calendarPreferences || preferences;
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarPreferences: preferences
        })
      });

      if (response.ok) {
        alert('Calendar preferences saved successfully!');
      } else {
        alert('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar preferences...</p>
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
            <h1 className="text-2xl font-bold text-white">Calendar Settings</h1>
            <p className="text-blue-100 mt-1">Configure your calendar preferences and sync settings</p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-8">
              {/* Primary Calendar Provider */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Calendar Provider</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 'internal', label: 'Internal Calendar', description: 'Use only the internal calendar system' },
                    { value: 'google', label: 'Google Calendar', description: 'Sync with Google Calendar (requires setup)' },
                    { value: 'outlook', label: 'Outlook Calendar', description: 'Sync with Microsoft Outlook (coming soon)' },
                    { value: 'apple', label: 'Apple Calendar', description: 'Sync with Apple Calendar (requires setup)' },
                    { value: 'caldav', label: 'CalDAV', description: 'Sync with CalDAV-compatible calendars (coming soon)' }
                  ].map((provider) => (
                    <label key={provider.value} className="relative">
                      <input
                        type="radio"
                        name="primaryProvider"
                        value={provider.value}
                        checked={preferences.primaryProvider === provider.value}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          primaryProvider: e.target.value as any
                        })}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        preferences.primaryProvider === provider.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="font-medium text-gray-900">{provider.label}</div>
                        <div className="text-sm text-gray-500 mt-1">{provider.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Provider Setup */}
              {preferences.primaryProvider === 'apple' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Apple Calendar Setup Required</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    You need to configure your Apple Calendar credentials to enable sync.
                  </p>
                  <a 
                    href="/settings/calendar/apple"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                  >
                    Configure Apple Calendar
                  </a>
                </div>
              )}

              {preferences.primaryProvider === 'google' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Google Calendar Setup Required</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Google Calendar integration is currently experiencing issues. We recommend using Apple Calendar instead.
                  </p>
                  <button 
                    onClick={() => setPreferences({ ...preferences, primaryProvider: 'apple' })}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Switch to Apple Calendar
                  </button>
                </div>
              )}

              {/* Sync Settings */}
              {preferences.primaryProvider !== 'internal' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Sync</label>
                        <p className="text-sm text-gray-500">Sync events between internal and external calendars</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.syncEnabled}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          syncEnabled: e.target.checked
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {preferences.syncEnabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sync Direction</label>
                          <select
                            value={preferences.syncDirection}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              syncDirection: e.target.value as any
                            })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="internal-to-external">Internal → External</option>
                            <option value="external-to-internal">External → Internal</option>
                            <option value="bidirectional">Bidirectional</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sync Interval (minutes)</label>
                            <input
                              type="number"
                              value={preferences.syncSettings.syncInterval}
                              onChange={(e) => setPreferences({
                                ...preferences,
                                syncSettings: {
                                  ...preferences.syncSettings,
                                  syncInterval: parseInt(e.target.value)
                                }
                              })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700">Sync Triggers</h3>
                          {[
                            { key: 'syncOnCreate', label: 'Sync on Create', description: 'Sync when new events are created' },
                            { key: 'syncOnUpdate', label: 'Sync on Update', description: 'Sync when events are updated' },
                            { key: 'syncOnDelete', label: 'Sync on Delete', description: 'Sync when events are deleted' }
                          ].map((trigger) => (
                            <div key={trigger.key} className="flex items-center justify-between">
                              <div>
                                <label className="text-sm font-medium text-gray-700">{trigger.label}</label>
                                <p className="text-sm text-gray-500">{trigger.description}</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={preferences.syncSettings[trigger.key as keyof typeof preferences.syncSettings] as boolean}
                                onChange={(e) => setPreferences({
                                  ...preferences,
                                  syncSettings: {
                                    ...preferences.syncSettings,
                                    [trigger.key]: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>

              {/* Calendar Sync Testing Section */}
              {preferences.primaryProvider !== 'internal' && (
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Calendar Sync</h2>
                  {!preferences.syncEnabled && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Sync is not enabled.</strong> Enable sync above and save your preferences to test calendar sync functionality.
                      </p>
                    </div>
                  )}
                  <CalendarSyncTester 
                    provider={preferences.primaryProvider}
                    syncEnabled={preferences.syncEnabled}
                  />
                </div>
              )}

              {/* Sync Status Section */}
              {preferences.primaryProvider !== 'internal' && (
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h2>
                  <SyncStatusDisplay provider={preferences.primaryProvider} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calendar Sync Tester Component
function CalendarSyncTester({ provider, syncEnabled }: { provider: string; syncEnabled: boolean }) {
  const { data: session } = useSession();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; eventId?: string } | null>(null);

  const testSync = async () => {
    if (!session?.user?.id) {
      setTestResult({
        success: false,
        message: 'You must be logged in to test calendar sync'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // Use the dedicated test sync endpoint
      const response = await fetch('/api/calendar/test-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: {
            from: 'test-doctor@example.com',
            subject: 'Test Appointment - Calendar Sync',
            body: `This is a test appointment to verify calendar sync functionality. 
                   Your appointment is scheduled for ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()} at 2:00 PM at Test Medical Center, 123 Test Street.`
          }
        })
      });

      const data = await response.json();
      
      if (data.success && data.appointmentCreated) {
        let message = `Test event created successfully! Event ID: ${data.eventId}`;
        if (data.syncResult) {
          if (data.syncResult.synced) {
            message += `\n✅ Event synced to ${data.syncResult.calendarType} calendar!`;
            if (data.syncResult.externalEventUrl) {
              message += `\nExternal Event ID: ${data.syncResult.externalEventId}`;
            }
          } else {
            message += `\n⚠️ Sync ${data.syncResult.error ? 'failed' : 'not enabled'}: ${data.syncResult.error || 'Calendar sync is not enabled in your preferences. Enable sync above and save to test automatic syncing.'}`;
          }
        } else {
          message += `\n⚠️ Sync not attempted: Calendar sync is not enabled in your preferences. Enable sync above and save to test automatic syncing.`;
        }
        setTestResult({
          success: true,
          message,
          eventId: data.eventId
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Failed to create test event'
        });
      }
    } catch (error) {
      console.error('Error testing sync:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test sync'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Test Calendar Sync Functionality</h3>
        <p className="text-sm text-gray-600">
          This will create a test appointment event and attempt to sync it to your {provider} calendar.
          Check your external calendar to verify the sync worked.
        </p>
      </div>

      <button
        onClick={testSync}
        disabled={testing}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? 'Testing...' : 'Test Calendar Sync'}
      </button>

      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            testResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {testResult.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p className={`text-sm mt-1 ${
            testResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {testResult.message}
          </p>
          {testResult.success && testResult.eventId && (
            <div className="mt-3">
              <a
                href={`/calendar/event/${testResult.eventId}`}
                className="text-sm text-green-700 hover:text-green-800 underline"
              >
                View Test Event →
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> The test will create a real calendar event. You can delete it from your calendar after testing.
        </p>
      </div>
    </div>
  );
}

// Sync Status Display Component
function SyncStatusDisplay({ provider }: { provider: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncedEvents();
  }, []);

  const loadSyncedEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events');
      if (response.ok) {
        const data = await response.json();
        // Filter events that have been synced to external calendar
        const syncedEvents = (data.events || []).filter((event: any) => 
          (provider === 'google' && event.googleEventId) ||
          (provider === 'apple' && event.appleEventId)
        );
        setEvents(syncedEvents.slice(0, 5)); // Show last 5 synced events
      }
    } catch (error) {
      console.error('Error loading synced events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading sync status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Sync Provider</span>
          <span className="text-sm text-gray-900 capitalize">{provider} Calendar</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Synced Events</span>
          <span className="text-sm text-gray-900">{events.length} recent events</span>
        </div>
      </div>

      {events.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recently Synced Events</h4>
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event._id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.startDate).toLocaleDateString()} at{' '}
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="ml-4">
                    {provider === 'google' && event.googleEventUrl && (
                      <a
                        href={event.googleEventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View in Google →
                      </a>
                    )}
                    {provider === 'apple' && event.appleEventUrl && (
                      <a
                        href={event.appleEventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View in Apple →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No synced events found. Create an event or test the sync to see events here.
          </p>
        </div>
      )}
    </div>
  );
}
