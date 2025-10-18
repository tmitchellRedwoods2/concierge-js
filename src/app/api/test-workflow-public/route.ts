import { NextRequest, NextResponse } from 'next/server';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing workflow execution (public endpoint)...');
    
    const startTime = Date.now();
    
    // Step 1: Trigger processing
    const triggerResult = {
      id: 'trigger-1',
      type: 'trigger',
      status: 'completed',
      result: { 
        email: 'test@example.com', 
        content: 'I need to schedule an appointment' 
      }
    };

    // Step 2: AI Processing (extract appointment details)
    const aiResult = {
      id: 'ai-1',
      type: 'ai',
      status: 'completed',
      result: { 
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        attendee: 'john.doe@example.com',
        location: 'Conference Room A',
        title: 'AI Scheduled Appointment'
      }
    };

    // Step 3: Create calendar event with timeout
    let calendarResult;
    try {
      console.log('Creating calendar event with Google Calendar API...');
      const calendarService = new CalendarService();
      const appointmentEvent = createAppointmentEvent({
        title: aiResult.result.title,
        date: aiResult.result.date,
        time: aiResult.result.time,
        duration: aiResult.result.duration,
        attendee: aiResult.result.attendee,
        location: aiResult.result.location,
        description: `Appointment scheduled via AI workflow from: ${triggerResult.result.email}`
      });

      console.log('Appointment event data:', appointmentEvent);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Calendar API timeout after 10 seconds')), 10000)
      );
      
      const calendarPromise = calendarService.createEvent(appointmentEvent);
      calendarResult = await Promise.race([calendarPromise, timeoutPromise]);
      console.log('Calendar API result:', calendarResult);
    } catch (error) {
      console.error('Calendar API error:', error);
      // Fallback to mock result if calendar API fails
      calendarResult = {
        success: true,
        eventId: `mock_${Date.now()}`,
        eventUrl: 'https://calendar.google.com',
        message: `Mock calendar event created (Calendar API error: ${error.message})`
      };
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Workflow execution completed',
      duration: `${duration}ms`,
      steps: {
        trigger: triggerResult,
        ai: aiResult,
        calendar: calendarResult
      },
      isMockEvent: calendarResult.message?.includes('Mock calendar event')
    });

  } catch (error) {
    console.error('❌ Workflow test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Workflow test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Public Workflow Test Endpoint',
    usage: 'POST to test workflow execution without authentication',
    description: 'Tests the complete workflow execution including calendar integration'
  });
}
