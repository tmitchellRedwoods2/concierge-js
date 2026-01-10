'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ParsedAppointment {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  confidence: number;
  attendees?: string[];
}

interface TestResult {
  success: boolean;
  message: string;
  appointmentCreated?: boolean;
  eventId?: string;
  parsedAppointment?: ParsedAppointment;
  syncResult?: {
    synced: boolean;
    calendarType?: string;
    externalEventId?: string;
    error?: string;
  };
}

export default function EmailToCalendarTestPage() {
  const { data: session, status } = useSession();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [emailContent, setEmailContent] = useState({
    from: 'appointments@medicalcenter.com',
    subject: 'Appointment Confirmation - Dr. Smith',
    body: `Dear Patient,

This is a confirmation of your upcoming appointment:

Date: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Time: 2:00 PM
Doctor: Dr. Sarah Smith
Location: Medical Center, 123 Health Street, Suite 200, San Francisco, CA 94102
Appointment Type: Annual Physical Examination

Please arrive 15 minutes early to complete any necessary paperwork.

If you need to reschedule or cancel, please call us at (555) 123-4567 at least 24 hours in advance.

We look forward to seeing you!

Best regards,
Medical Center Appointment System`
  });

  const runTest = async () => {
    if (!session?.user?.id) {
      setTestResult({
        success: false,
        message: 'You must be logged in to test the email-to-calendar workflow'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/calendar/test-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent
        })
      });

      const data = await response.json();
      console.log('📧 Test result:', data);

      if (data.success && data.appointmentCreated) {
        setTestResult({
          success: true,
          message: 'Email successfully parsed and calendar event created!',
          appointmentCreated: true,
          eventId: data.eventId,
          parsedAppointment: data.appointment,
          syncResult: data.syncResult
        });
      } else if (data.success && data.isDuplicate) {
        setTestResult({
          success: true,
          message: 'Event already exists (duplicate detected)',
          appointmentCreated: false,
          eventId: data.eventId,
          parsedAppointment: data.appointment
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Failed to process email'
        });
      }
    } catch (error) {
      console.error('Error testing email workflow:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test email workflow'
      });
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to test the email-to-calendar workflow</p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Login
          </a>
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
              Email-to-Calendar Automation Test
            </h1>
            <p className="text-blue-100 mt-1">
              Test the fully automated workflow: Email → Parse → Create Calendar Event
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Email Input Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Sample Doctor's Appointment Email</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <input
                    type="text"
                    value={emailContent.from}
                    onChange={(e) => setEmailContent({ ...emailContent, from: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailContent.subject}
                    onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                  <textarea
                    value={emailContent.body}
                    onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                    rows={12}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Test Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={runTest}
                disabled={testing}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Email...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    Test Email-to-Calendar Workflow
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            {testResult && (
              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Results</h2>
                
                {/* Success/Failure Banner */}
                <div className={`mb-6 p-4 rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '✅ Success' : '❌ Failed'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parsed Appointment Details */}
                {testResult.parsedAppointment && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Parsed Appointment Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700 font-medium">Title:</span>
                        <span className="text-blue-900">{testResult.parsedAppointment.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 font-medium">Start Date:</span>
                        <span className="text-blue-900">
                          {new Date(testResult.parsedAppointment.startDate).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 font-medium">End Date:</span>
                        <span className="text-blue-900">
                          {new Date(testResult.parsedAppointment.endDate).toLocaleString()}
                        </span>
                      </div>
                      {testResult.parsedAppointment.location && (
                        <div className="flex justify-between">
                          <span className="text-blue-700 font-medium">Location:</span>
                          <span className="text-blue-900">{testResult.parsedAppointment.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-blue-700 font-medium">Confidence:</span>
                        <span className="text-blue-900">
                          {(testResult.parsedAppointment.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar Sync Status */}
                {testResult.syncResult && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    testResult.syncResult.synced
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <h3 className="text-sm font-semibold mb-2">
                      Calendar Sync Status
                    </h3>
                    {testResult.syncResult.synced ? (
                      <p className="text-sm text-green-700">
                        ✅ Event synced to {testResult.syncResult.calendarType} calendar
                        {testResult.syncResult.externalEventId && (
                          <span className="block mt-1">External Event ID: {testResult.syncResult.externalEventId}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-700">
                        ⚠️ {testResult.syncResult.error || 'Calendar sync not enabled'}
                      </p>
                    )}
                  </div>
                )}

                {/* Event Links */}
                {testResult.eventId && (
                  <div className="space-y-2">
                    <a
                      href={`/calendar/event/${testResult.eventId}`}
                      className="block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      View Created Calendar Event →
                    </a>
                    <a
                      href="/calendar"
                      className="block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-center"
                    >
                      View All Calendar Events →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">How It Works</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Enter or modify the sample doctor's appointment email above</li>
                <li>Click "Test Email-to-Calendar Workflow"</li>
                <li>The system will automatically:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Parse the email to extract appointment details (date, time, location, doctor)</li>
                    <li>Create a calendar event in your internal calendar</li>
                    <li>Sync to your external calendar (if enabled in settings)</li>
                    <li>Send you a confirmation notification</li>
                  </ul>
                </li>
                <li>View the created event using the links above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

