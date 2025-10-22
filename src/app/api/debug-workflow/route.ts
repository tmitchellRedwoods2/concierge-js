import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    console.log('🔍 Testing calendar service...');
    
    // Test calendar service creation
    let calendarService;
    try {
      calendarService = new CalendarService();
      console.log('✅ CalendarService created successfully');
    } catch (error) {
      console.error('❌ CalendarService creation failed:', error);
      return NextResponse.json({
        success: false,
        error: 'CalendarService creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test appointment event creation
    let appointmentEvent;
    try {
      appointmentEvent = createAppointmentEvent({
        title: 'Debug Test Appointment',
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        attendee: 'test@example.com',
        location: 'Test Location',
        description: 'Debug test appointment'
      });
      console.log('✅ Appointment event created successfully');
    } catch (error) {
      console.error('❌ Appointment event creation failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Appointment event creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test calendar event creation with timeout
    let calendarResult;
    try {
      console.log('📅 Testing calendar event creation...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Calendar API timeout after 5 seconds')), 5000)
      );
      
      const calendarPromise = calendarService.createEvent(appointmentEvent, 'brtracker.docs@gmail.com', session.user.id);
      calendarResult = await Promise.race([calendarPromise, timeoutPromise]);
      
      console.log('✅ Calendar event created successfully:', calendarResult);
      
      return NextResponse.json({
        success: true,
        message: 'Calendar integration working perfectly',
        calendarResult: calendarResult
      });
      
    } catch (error) {
      console.error('❌ Calendar event creation failed:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Calendar event creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        calendarResult: null
      });
    }

  } catch (error) {
    console.error('Debug workflow error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug workflow failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
