import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing simple workflow execution...');
    
    const startTime = Date.now();
    
    // Simulate workflow steps without calendar integration
    const steps = [
      {
        id: 'trigger-1',
        name: 'Email Trigger',
        status: 'completed',
        result: { email: 'test@example.com', content: 'I need to schedule an appointment' }
      },
      {
        id: 'ai-1', 
        name: 'AI Processing',
        status: 'completed',
        result: { 
          date: '2024-01-15',
          time: '14:00',
          title: 'Test Appointment'
        }
      },
      {
        id: 'calendar-1',
        name: 'Calendar Integration',
        status: 'completed',
        result: { 
          eventId: `mock_${Date.now()}`,
          message: 'Mock calendar event created (Calendar integration disabled for testing)'
        }
      }
    ];
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Simple workflow execution completed',
      duration: `${duration}ms`,
      steps: steps,
      executionId: `exec_${Date.now()}`,
      status: 'completed'
    });

  } catch (error) {
    console.error('❌ Simple workflow test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Simple workflow test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Workflow Test Endpoint',
    usage: 'POST to test basic workflow execution',
    description: 'Tests workflow execution without calendar integration'
  });
}
