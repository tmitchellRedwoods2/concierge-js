import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Budget from '@/lib/db/models/Budget';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const budgets = await Budget.find({ userId: session.user.id, isActive: true })
      .sort({ createdAt: -1 });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { name, category, amount, period, startDate, endDate } = body;

    // Validate required fields
    if (!name || !category || !amount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, amount, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const budget = new Budget({
      userId: session.user.id,
      name,
      category,
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      currentSpent: 0
    });

    await budget.save();

    return NextResponse.json({ 
      status: 'ok',
      budget,
      message: 'Budget created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
