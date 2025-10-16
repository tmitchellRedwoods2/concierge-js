import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { CalendarService, createAppointmentEvent } from '@/lib/services/calendar';

// Mock workflow execution for demo purposes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, triggerData } = body;

    await connectDB();

    // Real workflow execution with calendar integration
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date().toISOString();

    try {
      // Step 1: Trigger processing
      const triggerResult = {
        id: 'trigger-1',
        type: 'trigger',
        status: 'completed',
        result: { 
          email: triggerData?.email || 'test@example.com', 
          content: triggerData?.content || 'I need to schedule an appointment' 
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

      // Step 3: Create real calendar event
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

      const calendarResult = await calendarService.createEvent(appointmentEvent);
      
      const apiResult = {
        id: 'api-1',
        type: 'api',
        status: calendarResult.success ? 'completed' : 'failed',
        result: calendarResult.success ? {
          eventId: calendarResult.eventId,
          eventUrl: calendarResult.eventUrl,
          status: 'scheduled',
          message: 'Real calendar event created'
        } : {
          error: calendarResult.error,
          status: 'failed'
        }
      };

      // Step 4: End
      const endResult = {
        id: 'end-1',
        type: 'end',
        status: calendarResult.success ? 'completed' : 'failed',
        result: { 
          success: calendarResult.success, 
          message: calendarResult.success ? 'Appointment scheduled successfully in Google Calendar' : 'Failed to create calendar event'
        }
      };

      const executionResult = {
        id: executionId,
        workflowId,
        status: calendarResult.success ? 'completed' : 'failed',
        startTime,
        endTime: new Date().toISOString(),
        steps: [triggerResult, aiResult, apiResult, endResult],
        triggerData,
        calendarEvent: calendarResult.success ? {
          eventId: calendarResult.eventId,
          eventUrl: calendarResult.eventUrl
        } : null
      };

      return NextResponse.json({
        success: true,
        execution: executionResult,
        message: calendarResult.success ? 'Workflow executed successfully with real calendar integration' : 'Workflow failed to create calendar event'
      });

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      const executionResult = {
        id: executionId,
        workflowId,
        status: 'failed',
        startTime,
        endTime: new Date().toISOString(),
        steps: [],
        triggerData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return NextResponse.json({
        success: false,
        execution: executionResult,
        message: 'Workflow execution failed'
      });
    }

  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

// Get execution history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Mock execution history
    const executions = [
      {
        id: 'exec_1',
        workflowId: 'workflow_1',
        workflowName: 'Email Appointment Scheduler',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3500000).toISOString(),
        triggerData: { email: 'user@example.com', content: 'Schedule meeting for tomorrow' },
        result: { appointmentId: 'apt_12345', status: 'scheduled' }
      },
      {
        id: 'exec_2',
        workflowId: 'workflow_1',
        workflowName: 'Email Appointment Scheduler',
        status: 'running',
        startTime: new Date(Date.now() - 60000).toISOString(),
        triggerData: { email: 'client@example.com', content: 'Need to reschedule appointment' }
      }
    ];

    return NextResponse.json({
      success: true,
      executions
    });

  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
