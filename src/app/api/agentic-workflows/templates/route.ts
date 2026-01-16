/**
 * Agentic Workflows Templates API
 * 
 * GET /api/agentic-workflows/templates
 * Returns available workflow templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplatesForAccessMode,
} from '@/lib/services/workflow-templates';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const userRole = (session.user as any).role || 'client';
    const accessMode = (session.user as any).accessMode || 'self-service';
    
    // Admins and agents can see all templates
    // Clients can see templates for their access mode
    if (userRole !== 'admin' && userRole !== 'agent') {
      if (!hasPermission(userRole, 'view:agentic-workflows', accessMode)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as
      | 'health'
      | 'finance'
      | 'travel'
      | 'calendar'
      | 'expenses'
      | null;
    const accessModeFilter = searchParams.get('accessMode');

    let templates;

    if (category) {
      templates = getTemplatesByCategory(category);
    } else if (accessModeFilter && userRole === 'admin') {
      // Admins can filter by access mode
      templates = getTemplatesForAccessMode(accessModeFilter);
    } else if (userRole === 'client') {
      // Clients see templates for their access mode
      templates = getTemplatesForAccessMode(accessMode);
    } else {
      // Admins and agents see all templates
      templates = getAllTemplates();
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('❌ Error fetching workflow templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow templates' },
      { status: 500 }
    );
  }
}
