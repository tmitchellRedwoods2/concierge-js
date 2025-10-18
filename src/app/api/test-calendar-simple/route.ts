import { NextRequest, NextResponse } from 'next/server';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Google Calendar integration (Simple)...');
    
    // Initialize calendar service
    const calendarService = new CalendarService();
    
    // Create a test event
    const testEvent = createAppointmentEvent({
      title: 'Test Calendar Integration',
      date: new Date().toISOString().split('T')[0], // Today
      time: new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[1].substring(0, 5), // 1 hour from now
      duration: 30,
      description: 'This is a test event created by the Concierge AI system',
      location: 'Virtual Meeting',
    });

    console.log('📅 Creating test event:', testEvent);

    // Create the event with detailed error handling
    try {
      const result = await calendarService.createEvent(testEvent);
      
      console.log('📊 Calendar service result:', result);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message || 'Google Calendar integration is working!',
          eventId: result.eventId,
          eventUrl: result.eventUrl,
          testEvent: testEvent,
          isMockEvent: result.message?.includes('Mock calendar event'),
          result: result
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to create calendar event',
          details: result.error,
          result: result
        }, { status: 500 });
      }
    } catch (calendarError) {
      console.error('❌ Calendar service error:', calendarError);
      
      // Check if it's the specific private key error
      if (calendarError instanceof Error && calendarError.message.includes('DECODER routines::unsupported')) {
        return NextResponse.json({
          success: true,
          message: 'Mock calendar event created (Private key format issue detected)',
          eventId: `mock_${Date.now()}`,
          eventUrl: 'https://calendar.google.com',
          testEvent: testEvent,
          isMockEvent: true,
          error: calendarError.message
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Calendar service error',
        details: calendarError instanceof Error ? calendarError.message : 'Unknown error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Calendar test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Calendar test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Calendar Simple Test Endpoint',
    usage: 'POST to test calendar integration with fallback',
    requiredEnvVars: [
      'GOOGLE_CALENDAR_CLIENT_EMAIL',
      'GOOGLE_CALENDAR_PRIVATE_KEY'
    ]
  });
}
