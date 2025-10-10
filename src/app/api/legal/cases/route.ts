import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import LegalCase from '@/lib/db/models/LegalCase';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const caseType = searchParams.get('caseType');
    const priority = searchParams.get('priority');

    // Build query
    const query: any = { userId: session.user.id };
    if (status) query.status = status;
    if (caseType) query.caseType = caseType;
    if (priority) query.priority = priority;
    
    const cases = await LegalCase.find(query)
      .populate('lawFirmId')
      .sort({ lastActivity: -1 });

    // Calculate summary statistics
    const activeCases = cases.filter(c => c.status === 'ACTIVE');
    const totalEstimatedCost = cases.reduce((sum, c) => sum + (c.estimatedCost || 0), 0);
    const totalActualCost = cases.reduce((sum, c) => sum + (c.actualCost || 0), 0);
    const upcomingDeadlines = cases.filter(c => 
      c.nextDeadline && new Date(c.nextDeadline) > new Date() && new Date(c.nextDeadline) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    return NextResponse.json({ 
      status: 'ok',
      cases,
      summary: {
        totalCases: cases.length,
        activeCases: activeCases.length,
        totalEstimatedCost,
        totalActualCost,
        upcomingDeadlines: upcomingDeadlines.length
      }
    });
  } catch (error) {
    console.error('Error fetching legal cases:', error);
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
      caseNumber,
      title,
      description,
      caseType,
      status,
      priority,
      startDate,
      endDate,
      estimatedResolution,
      jurisdiction,
      courtName,
      judgeName,
      estimatedCost,
      actualCost,
      retainerAmount,
      hourlyRate,
      contingencyFee,
      primaryAttorney,
      lawFirmId,
      paralegal,
      legalAssistant,
      nextCourtDate,
      nextDeadline,
      opposingParty,
      opposingCounsel,
      witnesses,
      evidence,
      notes,
      tags
    } = body;

    // Generate unique case number if not provided
    const generateUniqueCaseNumber = async () => {
      let uniqueCaseNumber = caseNumber || `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Check if case number already exists and generate new one if needed
      while (await LegalCase.findOne({ caseNumber: uniqueCaseNumber })) {
        uniqueCaseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }
      
      return uniqueCaseNumber;
    };

    const finalCaseNumber = await generateUniqueCaseNumber();

    // Create new legal case
    const legalCase = new LegalCase({
      userId: session.user.id,
      caseNumber: finalCaseNumber,
      title,
      description,
      caseType,
      status: status || 'ACTIVE',
      priority: priority || 'MEDIUM',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      estimatedResolution: estimatedResolution ? new Date(estimatedResolution) : undefined,
      jurisdiction,
      courtName,
      judgeName,
      estimatedCost: parseFloat(estimatedCost) || 0,
      actualCost: parseFloat(actualCost) || 0,
      retainerAmount: parseFloat(retainerAmount) || 0,
      hourlyRate: parseFloat(hourlyRate) || undefined,
      contingencyFee: parseFloat(contingencyFee) || undefined,
      primaryAttorney,
      lawFirmId,
      paralegal,
      legalAssistant,
      nextCourtDate: nextCourtDate ? new Date(nextCourtDate) : undefined,
      nextDeadline: nextDeadline ? new Date(nextDeadline) : undefined,
      opposingParty,
      opposingCounsel,
      witnesses: witnesses || [],
      evidence: evidence || [],
      notes: notes || '',
      tags: tags || []
    });

    await legalCase.save();

    return NextResponse.json({ 
      status: 'ok',
      case: legalCase,
      message: 'Legal case created successfully'
    });
  } catch (error) {
    console.error('Error creating legal case:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
