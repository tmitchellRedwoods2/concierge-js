import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import InsurancePolicy from '@/lib/db/models/InsurancePolicy';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const policies = await InsurancePolicy.find({ userId: session.user.id })
      .populate('providerId')
      .sort({ createdAt: -1 });

    // Calculate summary statistics
    const activePolicies = policies.filter(p => p.status === 'ACTIVE');
    const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverageAmount, 0);
    const totalPremiums = activePolicies.reduce((sum, p) => {
      const annualPremium = p.premiumFrequency === 'MONTHLY' ? p.premiumAmount * 12 :
                           p.premiumFrequency === 'QUARTERLY' ? p.premiumAmount * 4 :
                           p.premiumFrequency === 'SEMI_ANNUAL' ? p.premiumAmount * 2 :
                           p.premiumAmount;
      return sum + annualPremium;
    }, 0);

    return NextResponse.json({ 
      status: 'ok',
      policies,
      summary: {
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        totalCoverage,
        totalAnnualPremiums: totalPremiums
      }
    });
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
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
      providerId,
      policyNumber,
      policyType,
      policyName,
      description,
      coverageAmount,
      deductible,
      premiumAmount,
      premiumFrequency,
      effectiveDate,
      expirationDate,
      agentName,
      agentPhone,
      agentEmail,
      beneficiaries,
      riders,
      notes
    } = body;

    // Calculate next payment date based on premium frequency
    const nextPaymentDate = new Date();
    switch (premiumFrequency) {
      case 'MONTHLY':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        break;
      case 'SEMI_ANNUAL':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
        break;
      case 'ANNUAL':
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        break;
    }

    // Create new insurance policy
    const policy = new InsurancePolicy({
      userId: session.user.id,
      providerId: providerId && providerId.trim() !== '' ? providerId : undefined,
      policyNumber,
      policyType,
      policyName,
      description,
      coverageAmount: parseFloat(coverageAmount),
      deductible: parseFloat(deductible),
      premiumAmount: parseFloat(premiumAmount),
      premiumFrequency,
      effectiveDate: new Date(effectiveDate),
      expirationDate: new Date(expirationDate),
      nextPaymentDate,
      agentName,
      agentPhone,
      agentEmail,
      beneficiaries: beneficiaries || [],
      riders: riders || [],
      notes: notes || ''
    });

    await policy.save();

    return NextResponse.json({ 
      status: 'ok',
      policy,
      message: 'Insurance policy added successfully'
    });
  } catch (error) {
    console.error('Error creating insurance policy:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
