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

      // Try to fetch events to test the connection
      const result = await appleCalendarService.getEvents();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Apple Calendar connection successful! You can now sync events.'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Connection failed: ${result.error}`
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
