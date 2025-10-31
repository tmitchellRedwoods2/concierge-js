import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automationEngine } from '@/lib/services/automation-engine';

// GET /api/automation/rules - Get all automation rules for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = automationEngine.getUserRules(session.user.id);
    
    return NextResponse.json({
      success: true,
      rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST /api/automation/rules - Create new automation rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger, actions, enabled = true } = body;

    // Validate required fields
    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, actions' },
        { status: 400 }
      );
    }

    const ruleId = await automationEngine.addRule({
      name,
      description: description || '',
      trigger,
      actions,
      enabled,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      ruleId,
      message: 'Automation rule created successfully'
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
