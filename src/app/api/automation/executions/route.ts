import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { automationEngine } from '@/lib/services/automation-engine';

// GET /api/automation/executions - Get execution logs for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let logs;
    if (ruleId) {
      logs = automationEngine.getRuleExecutionLogs(ruleId, limit);
    } else {
      logs = automationEngine.getUserExecutionLogs(session.user.id, limit);
    }

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution logs' },
      { status: 500 }
    );
  }
}

