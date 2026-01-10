import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';

/**
 * PUT /api/health/prescriptions/[id]/auto-refill
 * Enable or disable auto-refill for a prescription
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const { 
      autoRefillEnabled, 
      autoRefillDaysBefore 
    } = body;

    await connectDB();
    
    const prescription = await Prescription.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Update auto-refill settings
    if (typeof autoRefillEnabled === 'boolean') {
      prescription.autoRefillEnabled = autoRefillEnabled;
    }
    
    if (typeof autoRefillDaysBefore === 'number' && autoRefillDaysBefore >= 1 && autoRefillDaysBefore <= 30) {
      prescription.autoRefillDaysBefore = autoRefillDaysBefore;
    }

    await prescription.save();

    return NextResponse.json({
      success: true,
      prescription: {
        _id: prescription._id,
        medicationName: prescription.medicationName,
        autoRefillEnabled: prescription.autoRefillEnabled,
        autoRefillDaysBefore: prescription.autoRefillDaysBefore
      }
    });
  } catch (error: any) {
    console.error('Error updating auto-refill settings:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-refill settings', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/prescriptions/[id]/auto-refill
 * Get auto-refill settings for a prescription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await connectDB();
    
    const prescription = await Prescription.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prescriptionId: prescription._id.toString(),
      medicationName: prescription.medicationName,
      autoRefillEnabled: prescription.autoRefillEnabled,
      autoRefillDaysBefore: prescription.autoRefillDaysBefore,
      refillsRemaining: prescription.refillsRemaining,
      nextRefillDueDate: prescription.nextRefillDueDate,
      requiresPhysicianApproval: prescription.requiresPhysicianApproval,
      isMaintenanceMedication: prescription.isMaintenanceMedication
    });
  } catch (error: any) {
    console.error('Error getting auto-refill settings:', error);
    return NextResponse.json(
      { error: 'Failed to get auto-refill settings', message: error.message },
      { status: 500 }
    );
  }
}

