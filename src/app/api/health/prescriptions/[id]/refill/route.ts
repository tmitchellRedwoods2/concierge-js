import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prescriptionRefillAutomationService } from '@/lib/services/prescription-refill-automation';

/**
 * POST /api/health/prescriptions/[id]/refill
 * Request a refill for a prescription
 */
export async function POST(
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
    const manualRequest = body.manualRequest === true;

    const result = await prescriptionRefillAutomationService.requestRefill(
      id,
      session.user.id,
      manualRequest
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        refillId: result.refillId,
        estimatedReadyDate: result.estimatedReadyDate,
        pharmacyConfirmationNumber: result.pharmacyConfirmationNumber
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error requesting prescription refill:', error);
    return NextResponse.json(
      { error: 'Failed to request refill', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/prescriptions/[id]/refill-status
 * Get refill status for a prescription
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
    
    // Import Prescription model to get refill history
    const Prescription = (await import('@/lib/db/models/Prescription')).default;
    const connectDB = (await import('@/lib/db/mongodb')).default;
    
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

    // Get the most recent refill
    const recentRefill = prescription.refillHistory
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return NextResponse.json({
      prescriptionId: prescription._id.toString(),
      medicationName: prescription.medicationName,
      refillsRemaining: prescription.refillsRemaining,
      nextRefillDueDate: prescription.nextRefillDueDate,
      lastRefillDate: prescription.lastRefillDate,
      autoRefillEnabled: prescription.autoRefillEnabled,
      recentRefill: recentRefill ? {
        date: recentRefill.date,
        status: recentRefill.status,
        estimatedReady: recentRefill.estimatedReady,
        actualReady: recentRefill.actualReady,
        pickedUp: recentRefill.pickedUp,
        confirmationNumber: recentRefill.pharmacyConfirmationNumber,
        notes: recentRefill.notes
      } : null,
      refillHistory: prescription.refillHistory.map((refill: any) => ({
        date: refill.date,
        status: refill.status,
        estimatedReady: refill.estimatedReady,
        actualReady: refill.actualReady,
        pickedUp: refill.pickedUp,
        confirmationNumber: refill.pharmacyConfirmationNumber,
        notes: refill.notes
      }))
    });
  } catch (error: any) {
    console.error('Error getting refill status:', error);
    return NextResponse.json(
      { error: 'Failed to get refill status', message: error.message },
      { status: 500 }
    );
  }
}

