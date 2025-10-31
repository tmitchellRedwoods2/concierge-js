import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllTemplates, getTemplate } from '@/lib/services/automation-templates';
import { automationEngine } from '@/lib/services/automation-engine';

// GET /api/automation/templates - Get all available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = getAllTemplates();

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching automation templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation templates' },
      { status: 500 }
    );
  }
}

// POST /api/automation/templates - Create rule from template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, customizations = {} } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      );
    }

    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Apply customizations
    const customizedTemplate = {
      ...template,
      ...customizations,
      userId: session.user.id
    };

    const ruleId = await automationEngine.addRule(customizedTemplate);

    return NextResponse.json({
      success: true,
      ruleId,
      message: 'Automation rule created from template successfully'
    });
  } catch (error) {
    console.error('Error creating rule from template:', error);
    return NextResponse.json(
      { error: 'Failed to create rule from template' },
      { status: 500 }
    );
  }
}
