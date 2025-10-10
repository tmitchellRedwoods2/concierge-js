import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import TaxDeduction from '@/lib/db/models/TaxDeduction';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const taxYear = searchParams.get('taxYear');
    const category = searchParams.get('category');

    // Build query
    const query: any = { userId: session.user.id };
    if (taxYear) query.taxYear = parseInt(taxYear);
    if (category) query.category = category;
    
    const deductions = await TaxDeduction.find(query)
      .sort({ date: -1 });

    // Calculate summary statistics by category
    const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const deductionsByCategory = deductions.reduce((acc: any, d) => {
      const cat = d.category;
      if (!acc[cat]) {
        acc[cat] = { count: 0, total: 0 };
      }
      acc[cat].count++;
      acc[cat].total += d.amount || 0;
      return acc;
    }, {});

    return NextResponse.json({ 
      status: 'ok',
      deductions,
      summary: {
        totalDeductions: deductions.length,
        totalAmount: totalDeductions,
        byCategory: deductionsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching tax deductions:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
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
    const {
      taxReturnId,
      taxYear,
      category,
      description,
      amount,
      date,
      receiptNumber,
      vendor,
      paymentMethod,
      businessPurpose,
      mileage,
      notes
    } = body;

    // Create new tax deduction
    const deduction = new TaxDeduction({
      userId: session.user.id,
      taxReturnId: taxReturnId || undefined,
      taxYear: parseInt(taxYear),
      category,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      receiptNumber: receiptNumber || undefined,
      vendor: vendor || undefined,
      paymentMethod: paymentMethod || undefined,
      businessPurpose: businessPurpose || undefined,
      mileage: mileage ? parseFloat(mileage) : undefined,
      verified: false,
      approved: false,
      notes: notes || undefined
    });

    await deduction.save();

    return NextResponse.json({ 
      status: 'ok',
      deduction,
      message: 'Deduction added successfully'
    });
  } catch (error) {
    console.error('Error creating tax deduction:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const deductionId = searchParams.get('id');

    if (!deductionId) {
      return NextResponse.json({ error: 'Deduction ID required' }, { status: 400 });
    }

    const deduction = await TaxDeduction.findOneAndDelete({
      _id: deductionId,
      userId: session.user.id
    });

    if (!deduction) {
      return NextResponse.json({ error: 'Deduction not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Deduction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deduction:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
