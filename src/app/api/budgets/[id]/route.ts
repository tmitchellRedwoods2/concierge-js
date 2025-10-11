import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Budget from '@/lib/db/models/Budget';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      body,
      { new: true }
    );

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
