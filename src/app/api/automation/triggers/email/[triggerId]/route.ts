import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailTriggerService } from '@/lib/services/email-trigger';

// DELETE /api/automation/triggers/email/[triggerId] - Delete email trigger
export async function DELETE(
  request: NextRequest,
  { params }: { params: { triggerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = emailTriggerService.deleteTrigger(params.triggerId);
    
    if (!success) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email trigger deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email trigger:', error);
    return NextResponse.json(
      { error: 'Failed to delete email trigger' },
      { status: 500 }
    );
  }
}
