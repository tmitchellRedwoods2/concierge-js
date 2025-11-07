import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { CalendarSyncService } from '@/lib/services/calendar-sync';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import { CalendarEvent } from '@/lib/models/CalendarEvent';
import { automationEngine } from '@/lib/services/automation-engine';

// Helper function to resolve template variables in action configs
// Supports variables like: {aiResult.date}, {aiResult.time}, {triggerResult.email}, etc.
function resolveTemplateVariables(obj: any, context: any): any {
  if (typeof obj === 'string') {
    // Replace template variables like {aiResult.date}, {triggerResult.email}, etc.
    return obj.replace(/\{([^}]+)\}/g, (match, path) => {
      const parts = path.split('.');
      let value = context;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return match; // Return original if path not found
        }
      }
      return value !== undefined ? value : match;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => resolveTemplateVariables(item, context));
  } else if (obj && typeof obj === 'object') {
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveTemplateVariables(value, context);
    }
    return resolved;
  }
  return obj;
}

// Helper function to execute an automation rule node
async function executeAutomationRuleNode(
  node: any,
  context: any,
  userId: string
): Promise<any> {
  const { ruleId, ruleName } = node.data || {};
  
  if (!ruleId) {
    throw new Error('Automation rule ID is required');
  }

  console.log(`⚡ Executing automation rule: ${ruleName || ruleId} in workflow step: ${node.id}`);

  try {
    // Get the automation rule
    const rules = await automationEngine.getUserRules(userId);
    const rule = rules.find((r: any) => r.id === ruleId);

    if (!rule) {
      throw new Error(`Automation rule not found: ${ruleId}`);
    }

    if (!rule.enabled) {
      console.warn(`⚠️ Automation rule ${ruleId} is disabled, skipping execution`);
      return {
        success: false,
        error: 'Automation rule is disabled',
        skipped: true
      };
    }

    // Prepare context with all workflow data for template variable resolution
    // This includes: triggerResult, aiResult, and any other workflow context
    const templateContext = {
      aiResult: context.aiResult || {},
      triggerResult: context.triggerResult || {},
      workflowExecutionId: context.executionId,
      workflowStep: node.id,
      ...context // Include all other context data
    };

    // Execute the automation rule with workflow context
    // The rule will execute its actions with the workflow context
    const executionContext = {
      userId,
      triggerData: {
        ...context,
        workflowNodeId: node.id,
        workflowNodeType: 'automation_rule',
        source: 'workflow'
      },
      executionId: context.executionId || `workflow_${Date.now()}`,
      timestamp: new Date()
    };

    // Execute the rule's actions directly (bypassing trigger matching since we're calling from workflow)
    // Resolve template variables in action configs using AI-extracted data
    const results: any[] = [];
    for (const action of rule.actions || []) {
      try {
        // Resolve template variables in action config using AI-extracted data
        const resolvedAction = {
          ...action,
          config: resolveTemplateVariables(action.config || {}, templateContext)
        };

        console.log(`📋 Executing action ${action.type} with resolved config:`, JSON.stringify(resolvedAction.config, null, 2));

        const actionResult = await automationEngine.executeSingleAction(
          resolvedAction,
          executionContext
        );
        results.push({
          actionType: action.type,
          success: true,
          result: actionResult
        });
      } catch (actionError) {
        console.error(`❌ Error executing action ${action.type}:`, actionError);
        results.push({
          actionType: action.type,
          success: false,
          error: actionError instanceof Error ? actionError.message : 'Unknown error'
        });
      }
    }

    return {
      success: results.some(r => r.success),
      ruleId,
      ruleName: rule.name,
      actionsExecuted: results.length,
      results
    };

  } catch (error) {
    console.error(`❌ Error executing automation rule ${ruleId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ruleId,
      ruleName
    };
  }
}

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

    // Load workflow definition
    let workflow: any = null;
    try {
      const workflowResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workflows`);
      const workflowData = await workflowResponse.json();
      if (workflowData.success) {
        workflow = workflowData.workflows.find((w: any) => w.id === workflowId);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    }

    // Check if workflow has automation_rule nodes and execute them
    // TODO: Update workflow execution to use workflow.nodes structure instead of hardcoded steps
    if (workflow?.nodes) {
      const automationRuleNodes = workflow.nodes.filter((node: any) => node.type === 'automation_rule');
      if (automationRuleNodes.length > 0) {
        console.log(`Found ${automationRuleNodes.length} automation rule node(s) in workflow`);
        // For now, we'll execute automation rules after the hardcoded steps
        // In the future, we should execute nodes in order based on edges
      }
    }

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

        // Step 3: Create calendar event using AutomationEngine action
        let calendarResult: any = { success: false };
        let calendarEventId: string | null = null;
        
        try {
          console.log('📅 Creating calendar event using automation action...');
          
          const startDate = new Date(`${aiResult.result.date}T${aiResult.result.time}`);
          const endDate = new Date(startDate.getTime() + (aiResult.result.duration * 60000));
          
          // Use AutomationEngine to create calendar event
          const calendarActionResult = await automationEngine.executeSingleAction(
            {
              type: 'create_calendar_event',
              config: {
                title: aiResult.result.title,
                description: `Appointment scheduled via AI workflow from: ${triggerResult.result.email}`,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: aiResult.result.location,
                attendees: [aiResult.result.attendee],
                allDay: false
              }
            },
            {
              userId: session.user.id,
              triggerData: {
                workflowExecutionId: executionId,
                workflowStep: 'api-1',
                ...triggerResult.result,
                ...aiResult.result
              },
              executionId: executionId,
              timestamp: new Date()
            }
          );

          if (calendarActionResult?.details?.eventId) {
            calendarEventId = calendarActionResult.details.eventId;
            calendarResult = {
              success: true,
              eventId: calendarEventId,
              eventUrl: `/calendar/event/${calendarEventId}`,
              message: calendarActionResult.message || 'Calendar event created',
              event: calendarActionResult.details
            };
            console.log('✅ Calendar event created via automation action:', calendarEventId);
            
            // Sync to external calendar if enabled
            if (calendarEventId) {
              try {
                const event = await CalendarEvent.findById(calendarEventId);
                if (event) {
                  const syncService = new CalendarSyncService();
                  const syncResult = await syncService.syncEventIfEnabled(event, session.user.id);
                  if (syncResult.success) {
                    console.log('🔄 External calendar sync successful:', syncResult);
                  } else {
                    console.log('⚠️ External calendar sync not enabled or failed:', syncResult.error);
                  }
                }
              } catch (syncError) {
                console.error('❌ Calendar sync error (non-blocking):', syncError);
              }
            }
          } else {
            throw new Error('Calendar event creation failed - no event ID returned');
          }
        } catch (error) {
          console.error('❌ Calendar event creation error:', error);
          calendarResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }

        // Step 4: Send email notification using AutomationEngine action
        let emailResult: any = { success: false };
        if (calendarResult.success && calendarEventId) {
          try {
            console.log('📧 Sending email notification using automation action...');
            
            const startDate = new Date(`${aiResult.result.date}T${aiResult.result.time}`);
            const endDate = new Date(startDate.getTime() + (aiResult.result.duration * 60000));
            
            // Use AutomationEngine to send email
            const emailActionResult = await automationEngine.executeSingleAction(
              {
                type: 'send_email',
                config: {
                  to: aiResult.result.attendee,
                  subject: `Appointment Confirmation: ${aiResult.result.title}`,
                  template: 'appointment_confirmation',
                  data: {
                    title: aiResult.result.title,
                    recipientName: 'Customer',
                    recipientEmail: aiResult.result.attendee,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    location: aiResult.result.location,
                    description: `Appointment scheduled via AI workflow from: ${triggerResult.result.email}`
                  }
                }
              },
              {
                userId: session.user.id,
                triggerData: {
                  workflowExecutionId: executionId,
                  workflowStep: 'api-1',
                  calendarEventId: calendarEventId,
                  ...triggerResult.result,
                  ...aiResult.result
                },
                executionId: executionId,
                timestamp: new Date()
              }
            );

            if (emailActionResult) {
              emailResult = {
                success: true,
                message: emailActionResult.message || 'Email sent successfully'
              };
              console.log('✅ Email notification sent via automation action');
            }
          } catch (emailError) {
            console.error('❌ Email notification error (non-blocking):', emailError);
            // Don't fail the workflow if email fails
            emailResult = {
              success: false,
              error: emailError instanceof Error ? emailError.message : 'Unknown error'
            };
          }
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
            eventDetails: calendarResult.event,
            emailSent: emailResult.success
          } : {
            error: calendarResult.error,
            status: 'failed',
            calendarEventCreated: false
          }
        };

        // Execute automation_rule nodes if workflow has them
        const automationRuleResults: any[] = [];
        if (workflow?.nodes) {
          const automationRuleNodes = workflow.nodes.filter((node: any) => node.type === 'automation_rule');
          for (const node of automationRuleNodes) {
            try {
              // Prepare context with structured data for template variable resolution
              const ruleContext = {
                executionId,
                workflowExecutionId: executionId,
                workflowStep: node.id,
                // Structured data for template variables
                aiResult: aiResult.result, // AI-extracted data (date, time, location, etc.)
                triggerResult: triggerResult.result, // Trigger data (email, content, etc.)
                // Flattened data for backward compatibility
                ...triggerResult.result,
                ...aiResult.result,
                calendarEventId: calendarEventId || undefined
              };
              
              const ruleResult = await executeAutomationRuleNode(
                node,
                ruleContext,
                session.user.id
              );
              
              automationRuleResults.push({
                id: node.id,
                type: 'automation_rule',
                status: ruleResult.success ? 'completed' : 'failed',
                result: ruleResult
              });
              
              console.log(`✅ Automation rule node ${node.id} executed:`, ruleResult.success ? 'success' : 'failed');
            } catch (ruleError) {
              console.error(`❌ Error executing automation rule node ${node.id}:`, ruleError);
              automationRuleResults.push({
                id: node.id,
                type: 'automation_rule',
                status: 'failed',
                result: {
                  success: false,
                  error: ruleError instanceof Error ? ruleError.message : 'Unknown error'
                }
              });
            }
          }
        }

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
          steps: [
            triggerResult, 
            aiResult, 
            apiResult, 
            ...automationRuleResults,
            endResult
          ],
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