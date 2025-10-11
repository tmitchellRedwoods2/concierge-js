import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Expense from '@/lib/db/models/Expense';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const expenses = await Expense.find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(50);

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const { description, amount, category, date } = body;

    // Validate required fields
    if (!description || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: description and amount are required' },
        { status: 400 }
      );
    }

    const expense = new Expense({
      userId: session.user.id,
      description,
      amount: parseFloat(amount),
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0]
    });

    await expense.save();

    return NextResponse.json({ 
      status: 'ok',
      expense,
      message: 'Expense created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
