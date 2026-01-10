import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { automationEngine } from '@/lib/services/automation-engine';

// GET /api/automation/rules/[ruleId] - Get specific rule
export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await automationEngine.getUserRules(session.user.id);
    const rule = rules.find(r => r.id === params.ruleId);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Error fetching automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rule' },
      { status: 500 }
    );
  }
}

// PUT /api/automation/rules/[ruleId] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, name, description, trigger, actions } = body;

    // If only enabled is provided, use toggleRule for backward compatibility
    if (enabled !== undefined && name === undefined && description === undefined && trigger === undefined && actions === undefined) {
      if (typeof enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid enabled value' },
          { status: 400 }
        );
      }

      const success = await automationEngine.toggleRule(params.ruleId, enabled);
      
      if (!success) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Rule ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    }

    // Full rule update
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (trigger !== undefined) updates.trigger = trigger;
    if (actions !== undefined) {
      if (!Array.isArray(actions)) {
        return NextResponse.json(
          { error: 'Actions must be an array' },
          { status: 400 }
        );
      }
      updates.actions = actions;
    }
    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid enabled value' },
          { status: 400 }
        );
      }
      updates.enabled = enabled;
    }

    const success = await automationEngine.updateRule(params.ruleId, updates);
    
    if (!success) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/automation/rules/[ruleId] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await automationEngine.deleteRule(params.ruleId);
    
    if (!success) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}
