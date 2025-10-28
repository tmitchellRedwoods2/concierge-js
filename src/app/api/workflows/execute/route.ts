import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { InAppCalendarService } from '@/lib/services/in-app-calendar';
import { CalendarSyncService } from '@/lib/services/calendar-sync';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import { NotificationService } from '@/lib/services/notification-service';

// Mock workflow execution for demo purposes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, triggerData } = body;

    console.log('Starting workflow execution for:', workflowId);
    await connectDB();

    // Add overall timeout for the entire workflow execution
    const workflowTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Workflow execution timeout after 30 seconds')), 30000)
    );

    // Real workflow execution with calendar integration
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date().toISOString();

    // Wrap the entire workflow execution in a timeout
    const workflowExecution = async () => {
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

        // Step 3: Create internal calendar event
        let calendarResult;
        try {
          console.log('📅 Creating internal calendar event...');
          const inAppCalendarService = new InAppCalendarService();
          
          const startDate = new Date(`${aiResult.result.date}T${aiResult.result.time}`);
          const endDate = new Date(startDate.getTime() + (aiResult.result.duration * 60000));
          
          const eventData = {
            title: aiResult.result.title,
            description: `Appointment scheduled via AI workflow from: ${triggerResult.result.email}`,
            startDate: startDate,
            endDate: endDate,
            location: aiResult.result.location,
            attendees: [aiResult.result.attendee],
            reminders: {
              email: true,
              popup: true,
              minutes: 15
            },
            source: 'workflow' as const,
            workflowExecutionId: executionId
          };

          console.log('📅 Internal calendar event data:', eventData);
          
          calendarResult = await inAppCalendarService.createEvent(eventData, session.user.id);
          console.log('✅ Internal calendar result:', calendarResult);
          
          // Sync to external calendar if enabled
          if (calendarResult.success && calendarResult.event) {
            const syncService = new CalendarSyncService();
            const syncResult = await syncService.syncEventIfEnabled(calendarResult.event, session.user.id);
            console.log('🔄 External calendar sync result:', syncResult);
          }

          // Send email notification
          if (calendarResult.success && calendarResult.event) {
            try {
              console.log('📧 Sending email notification...');
              const notificationService = new NotificationService();
              const notificationResult = await notificationService.sendAppointmentConfirmation(
                {
                  _id: calendarResult.eventId,
                  title: aiResult.result.title,
                  description: `Appointment scheduled via AI workflow from: ${triggerResult.result.email}`,
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  location: aiResult.result.location,
                  attendees: [aiResult.result.attendee],
                },
                session.user.id,
                aiResult.result.attendee,
                'Customer'
              );

              if (notificationResult.success) {
                console.log('✅ Email notification sent successfully');
              } else {
                console.log('⚠️ Failed to send email notification:', notificationResult.error);
              }
            } catch (emailError) {
              console.error('❌ Email notification error (non-blocking):', emailError);
            }
          }
        } catch (error) {
          console.error('❌ Internal calendar error:', error);
          calendarResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        
        const apiResult = {
          id: 'api-1',
          type: 'api',
          status: calendarResult.success ? 'completed' : 'failed',
          result: calendarResult.success ? {
            eventId: calendarResult.eventId,
            eventUrl: calendarResult.eventUrl,
            status: 'scheduled',
            message: calendarResult.message || 'Calendar event created',
            calendarEventCreated: true,
            eventDetails: calendarResult.event
          } : {
            error: calendarResult.error,
            status: 'failed',
            calendarEventCreated: false
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
          workflowName: 'Fresh Appointment Scheduler',
          status: calendarResult.success ? 'completed' : 'failed',
          startTime,
          endTime: new Date().toISOString(),
          steps: [triggerResult, aiResult, apiResult, endResult],
          triggerData,
        result: calendarResult.success ? {
          appointmentId: calendarResult.eventId,
          status: 'scheduled',
          eventUrl: `/calendar/event/${calendarResult.eventId}`
        } : {
          error: calendarResult.error,
          status: 'failed'
        },
        calendarEvent: calendarResult.success ? {
          eventId: calendarResult.eventId,
          eventUrl: `/calendar/event/${calendarResult.eventId}`
        } : null
        };

        // Store execution in MongoDB
        try {
          const execution = new WorkflowExecution({
            ...executionResult,
            userId: session.user.id
          });
          await execution.save();
          console.log('✅ Execution stored in MongoDB:', executionResult.id);
        } catch (dbError) {
          console.error('❌ Failed to store execution in MongoDB:', dbError);
        }

        return NextResponse.json({
          success: true,
          execution: executionResult,
          message: calendarResult.success ? 'Workflow executed successfully with internal calendar integration' : 'Workflow failed to create calendar event'
        });

      } catch (error) {
        console.error('Workflow execution error:', error);
        
        const executionResult = {
          id: executionId,
          workflowId,
          workflowName: 'Fresh Appointment Scheduler',
          status: 'failed',
          startTime,
          endTime: new Date().toISOString(),
          steps: [],
          triggerData,
          result: {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          },
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        // Store failed execution in MongoDB
        try {
          const execution = new WorkflowExecution({
            ...executionResult,
            userId: session.user.id
          });
          await execution.save();
          console.log('✅ Failed execution stored in MongoDB:', executionResult.id);
        } catch (dbError) {
          console.error('❌ Failed to store execution in MongoDB:', dbError);
        }
        
        return NextResponse.json({
          success: false,
          execution: executionResult,
          message: 'Workflow execution failed'
        });
      }
    };

    // Execute workflow with timeout
    const result = await Promise.race([workflowExecution(), workflowTimeout]);
    return result;

  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // If it's a timeout error, return a specific response
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        execution: {
          id: `exec_${Date.now()}`,
          workflowId: body?.workflowId,
          status: 'timeout',
          startTime: new Date().toISOString(),
          triggerData: body?.triggerData,
          error: 'Workflow execution timed out after 30 seconds'
        },
        message: 'Workflow execution timed out'
      });
    }
    
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
    
    // Fetch executions from MongoDB
    const executions = await WorkflowExecution.find({ userId: session.user.id })
      .sort({ startTime: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      executions: executions,
      count: executions.length
    });

  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}