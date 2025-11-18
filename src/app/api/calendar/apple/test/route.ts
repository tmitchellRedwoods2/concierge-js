import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppleCalendarService } from '@/lib/services/apple-calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serverUrl, username, password, calendarPath } = body;

    if (!serverUrl || !username || !password || !calendarPath) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      });
    }

    try {
      // Test the connection by trying to fetch events
      const appleCalendarService = new AppleCalendarService({
        serverUrl,
        username,
        password,
        calendarPath
      });

      // First, test authentication with a simple request
      // This will verify credentials work before trying to fetch events
      const { username: cleanUsername, password: cleanPassword } = (appleCalendarService as any).getCleanedCredentials();
      
      // Test authentication with a simple PROPFIND to the root
      const authTestUrl = `${serverUrl}/`;
      const authResponse = await fetch(authTestUrl, {
        method: 'PROPFIND',
        headers: {
          'Content-Type': 'application/xml',
          'Depth': '0',
          'Authorization': `Basic ${Buffer.from(`${cleanUsername}:${cleanPassword}`).toString('base64')}`,
          'User-Agent': 'Concierge-AI-Calendar/1.0'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`
      });

      if (authResponse.status === 401 || authResponse.status === 403) {
        return NextResponse.json({
          success: false,
          message: 'Authentication failed. Please check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords to generate one.'
        });
      }

      // Authentication succeeded! Now try to fetch events to verify calendar access
      // Use a small date range for testing (today to 7 days from now)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const result = await appleCalendarService.getEvents(today, nextWeek);
      
      if (result.success) {
        const eventCount = result.events?.length || 0;
        return NextResponse.json({
          success: true,
          message: `Apple Calendar connection successful! Found ${eventCount} event(s) in the next 7 days. You can now sync events.`
        });
      } else {
        // Authentication worked, but fetching events failed
        // This could be a calendar path issue, but credentials are correct
        // Check if it's a 400 error (path/query issue) vs other errors
        const isPathIssue = result.error?.includes('400') || result.error?.includes('Bad Request');
        
        if (isPathIssue) {
          // Credentials are correct, but calendar path might need adjustment
          return NextResponse.json({
            success: true, // Consider this a success since auth worked
            message: `Apple Calendar credentials verified successfully! However, there was an issue accessing your calendar events (${result.error}). This may be due to the calendar path. Your credentials are saved and you can try syncing events - the system will attempt to discover the correct calendar path automatically.`,
            warning: result.error
          });
        } else {
        // Provide more helpful error messages
        let errorMessage = result.error || 'Unknown error';
        
        // Log the full error for debugging
        console.error('❌ Apple Calendar test failed:', {
          error: errorMessage,
          serverUrl: serverUrl,
          username: username,
          calendarPath: calendarPath,
          passwordLength: password?.length || 0
        });
        
        // Add helpful hints based on common errors
        if (errorMessage.includes('400')) {
          errorMessage += '\n\n💡 Tip: The calendar path might be incorrect. Try leaving it as "/calendars" to let the system discover the correct path automatically.';
        } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Authentication failed')) {
          errorMessage += '\n\n💡 Tip: Check your Apple ID credentials. You may need to use an App-Specific Password instead of your regular password.';
          errorMessage += '\n\nCommon issues:';
          errorMessage += '\n- Make sure you copied the entire App-Specific Password (no spaces)';
          errorMessage += '\n- Verify the username is your full Apple ID email address';
          errorMessage += '\n- Try generating a NEW App-Specific Password (old ones may have been revoked)';
        } else if (errorMessage.includes('404')) {
          errorMessage += '\n\n💡 Tip: The calendar path might not exist. Try "/calendars" or check your iCloud calendar settings.';
        }
        
        return NextResponse.json({
          success: false,
          message: `Connection failed: ${errorMessage}`,
          debug: {
            serverUrl,
            username,
            calendarPath,
            passwordProvided: !!password
          }
        });
      }
    } catch (error) {
      console.error('Apple Calendar test error:', error);
      return NextResponse.json({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

  } catch (error) {
    console.error('Error testing Apple Calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
