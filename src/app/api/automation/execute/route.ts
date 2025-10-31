import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automationEngine } from '@/lib/services/automation-engine';

// POST /api/automation/execute - Execute automation rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, triggerData = {} } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing required field: ruleId' },
        { status: 400 }
      );
    }

    const success = await automationEngine.executeRule(ruleId, {
      userId: session.user.id,
      triggerData
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to execute rule' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rule executed successfully'
    });
  } catch (error) {
    console.error('Error executing automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to execute automation rule' },
      { status: 500 }
    );
  }
}
