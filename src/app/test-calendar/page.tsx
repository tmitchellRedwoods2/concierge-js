'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCalendarPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCalendarIntegration = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Google Calendar Integration Test</CardTitle>
          <CardDescription>
            Test your Google Calendar integration setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testCalendarIntegration}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Calendar Integration'}
          </Button>

          {result && (
            <div className="mt-4 p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">
                {result.success ? '✅ Success!' : '❌ Error'}
              </h3>
              
              {result.success ? (
                <div className="space-y-2">
                  <p className="text-green-600">{result.message}</p>
                  {result.eventId && (
                    <p><strong>Event ID:</strong> {result.eventId}</p>
                  )}
                  {result.eventUrl && (
                    <p>
                      <strong>Event URL:</strong>{' '}
                      <a 
                        href={result.eventUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View in Google Calendar
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                  {result.details && (
                    <div>
                      <p><strong>Details:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">📋 Setup Checklist:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Set GOOGLE_CALENDAR_CLIENT_EMAIL in Vercel</li>
              <li>Set GOOGLE_CALENDAR_PRIVATE_KEY in Vercel</li>
              <li>Share your Google Calendar with the service account</li>
              <li>Give "Make changes to events" permission</li>
              <li>Redeploy your application</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
