import { NextRequest, NextResponse } from 'next/server';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Google Calendar integration...');
    
    // Check if environment variables are set
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
    
    console.log('🔍 Environment Variable Check:');
    console.log('📧 Client Email:', clientEmail ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key:', privateKey ? '✅ Set' : '❌ Missing');
    console.log('🔑 Private Key Length:', privateKey?.length || 0);
    console.log('🔑 Private Key Preview:', privateKey?.substring(0, 50) + '...');
    
    if (!clientEmail || !privateKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Google Calendar environment variables',
        details: {
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
          clientEmailValue: clientEmail || 'NOT_SET',
          privateKeyLength: privateKey?.length || 0,
        }
      }, { status: 400 });
    }

    console.log('✅ Environment variables found');
    console.log('📧 Client Email:', clientEmail);
    console.log('🔑 Private Key length:', privateKey.length);

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

    // Create the event
    const result = await calendarService.createEvent(testEvent);
    
    if (result.success) {
      console.log('✅ Calendar event created successfully:', result.eventId);
      
      return NextResponse.json({
        success: true,
        message: result.message || 'Google Calendar integration is working!',
        eventId: result.eventId,
        eventUrl: result.eventUrl,
        testEvent: testEvent,
        isMockEvent: result.message?.includes('Mock calendar event'),
      });
    } else {
      console.error('❌ Failed to create calendar event:', result.error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create calendar event',
        details: result.error,
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
    message: 'Google Calendar Test Endpoint',
    usage: 'POST to test calendar integration',
    requiredEnvVars: [
      'GOOGLE_CALENDAR_CLIENT_EMAIL',
      'GOOGLE_CALENDAR_PRIVATE_KEY'
    ]
  });
}
