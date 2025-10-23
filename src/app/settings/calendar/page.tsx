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
        setPreferences(data.calendarPreferences || preferences);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
