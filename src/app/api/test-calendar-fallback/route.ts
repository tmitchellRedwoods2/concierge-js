import { NextRequest, NextResponse } from 'next/server';
import { FallbackCalendarService, createAppointmentEvent } from '@/lib/services/calendar-fallback';

export async function POST(request: NextRequest) {
  try {
    console.log('🎭 Testing Fallback Calendar Service...');
    
    // Initialize fallback calendar service
    const calendarService = new FallbackCalendarService();
    
    // Create a test event
    const testEvent = createAppointmentEvent({
      title: 'Test Fallback Calendar Integration',
      date: new Date().toISOString().split('T')[0], // Today
      time: new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[1].substring(0, 5), // 1 hour from now
      duration: 30,
      description: 'This is a test event created by the Fallback Calendar Service',
      location: 'Virtual Meeting',
      attendee: 'test@example.com'
    });

    console.log('📅 Creating test event with fallback service:', testEvent);

    // Create the event
    const result = await calendarService.createEvent(testEvent);
    
    if (result.success) {
      console.log('✅ Fallback calendar event created successfully:', result.eventId);
      
      // Test listing events
      const listResult = await calendarService.listEvents();
      
      return NextResponse.json({
        success: true,
        message: 'Fallback Calendar Service is working!',
        eventId: result.eventId,
        eventUrl: result.eventUrl,
        testEvent: testEvent,
        mockEvents: listResult.events,
        totalMockEvents: listResult.events.length,
        serviceType: 'Fallback Mock Service'
      });
    } else {
      console.error('❌ Failed to create fallback calendar event:', result.error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create fallback calendar event',
        details: result.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Fallback calendar test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Fallback calendar test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fallback Calendar Service Test Endpoint',
    usage: 'POST to test fallback calendar integration',
    description: 'This endpoint tests the fallback calendar service that bypasses Google APIs entirely',
    features: [
      'Mock calendar event creation',
      'Event storage in memory',
      'Event listing and management',
      'No external API dependencies'
    ]
  });
}
