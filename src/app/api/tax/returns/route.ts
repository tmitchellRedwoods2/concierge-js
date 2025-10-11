import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import TaxReturn from '@/lib/db/models/TaxReturn';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const taxYear = searchParams.get('taxYear');
    const status = searchParams.get('status');

    // Build query
    const query: any = { userId: session.user.id };
    if (taxYear) query.taxYear = parseInt(taxYear);
    if (status) query.status = status;
    
    const returns = await TaxReturn.find(query)
      .populate('taxProfessionalId')
      .sort({ taxYear: -1 });

    // Calculate summary statistics
    const currentYear = new Date().getFullYear();
    const currentYearReturn = returns.find(r => r.taxYear === currentYear);
    const totalRefunds = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    const totalOwed = returns.reduce((sum, r) => sum + (r.amountOwed || 0), 0);

    return NextResponse.json({ 
      status: 'ok',
      returns,
      summary: {
        totalReturns: returns.length,
        currentYearStatus: currentYearReturn?.status || 'NOT_STARTED',
        totalRefunds,
        totalOwed
      }
    });
  } catch (error) {
    console.error('Error fetching tax returns:', error);
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
      taxYear,
      filingStatus,
      status,
      filingMethod,
      dueDate,
      wages,
      selfEmploymentIncome,
      investmentIncome,
      rentalIncome,
      retirementIncome,
      otherIncome,
      federalTaxWithheld,
      estimatedTaxPaid,
      notes
    } = body;

    // Validate required fields
    if (!taxYear || !filingStatus || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: taxYear, filingStatus, and dueDate are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalIncome = (parseFloat(wages) || 0) + 
                       (parseFloat(selfEmploymentIncome) || 0) + 
                       (parseFloat(investmentIncome) || 0) + 
                       (parseFloat(rentalIncome) || 0) + 
                       (parseFloat(retirementIncome) || 0) + 
                       (parseFloat(otherIncome) || 0);

    // Create new tax return
    const taxReturn = new TaxReturn({
      userId: session.user.id,
      taxYear: parseInt(taxYear),
      filingStatus,
      status: status || 'NOT_STARTED',
      filingMethod: filingMethod || 'E_FILE',
      dueDate: new Date(dueDate),
      extensionFiled: false,
      wages: parseFloat(wages) || 0,
      selfEmploymentIncome: parseFloat(selfEmploymentIncome) || 0,
      investmentIncome: parseFloat(investmentIncome) || 0,
      rentalIncome: parseFloat(rentalIncome) || 0,
      retirementIncome: parseFloat(retirementIncome) || 0,
      otherIncome: parseFloat(otherIncome) || 0,
      totalIncome,
      adjustedGrossIncome: totalIncome,
      federalTaxWithheld: parseFloat(federalTaxWithheld) || 0,
      estimatedTaxPaid: parseFloat(estimatedTaxPaid) || 0,
      notes: notes || ''
    });

    await taxReturn.save();

    return NextResponse.json({ 
      status: 'ok',
      taxReturn,
      message: 'Tax return created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tax return:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
