import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import { prescriptionRefillAutomationService } from '@/lib/services/prescription-refill-automation';
import { ParsedPrescriptionRefill } from '@/lib/services/health-email-parser';

/**
 * Request prescription refill
 * POST /api/health/prescriptions/[id]/refill
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find prescription
    const prescription = await Prescription.findOne({
      _id: params.id,
      userId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const body = await request.json();
    const { pharmacy, orderNumber, autoRequest } = body;

    // Create parsed refill object from request
    const parsedRefill: ParsedPrescriptionRefill = {
      type: 'prescription_refill',
      medicationName: prescription.medicationName,
      dosage: prescription.dosage,
      pharmacy: pharmacy || prescription.pharmacy,
      orderNumber,
      confidence: 0.9
    };

    // Process refill request
    const result = await prescriptionRefillAutomationService.processRefillRequest(
      parsedRefill,
      session.user.id,
      autoRequest || false
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      refillRequested: result.refillRequested,
      prescriptionId: result.prescriptionId,
      estimatedReadyDate: result.estimatedReadyDate,
      pharmacyConfirmation: result.pharmacyConfirmation,
      message: result.message
    });
  } catch (error) {
    console.error('Error requesting prescription refill:', error);
    return NextResponse.json(
      { error: 'Failed to request prescription refill' },
      { status: 500 }
    );
  }
}

/**
 * Get refill status
 * GET /api/health/prescriptions/[id]/refill-status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const prescription = await Prescription.findOne({
      _id: params.id,
      userId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Get most recent refill request
    const recentRefill = prescription.refillHistory && prescription.refillHistory.length > 0
      ? prescription.refillHistory[prescription.refillHistory.length - 1]
      : null;

    return NextResponse.json({
      prescriptionId: prescription._id.toString(),
      medicationName: prescription.medicationName,
      refillsRemaining: prescription.refillsRemaining,
      autoRefillEnabled: prescription.autoRefillEnabled || false,
      lastRefillRequestDate: prescription.lastRefillRequestDate,
      nextAutoRefillDate: prescription.nextAutoRefillDate,
      recentRefill: recentRefill ? {
        date: recentRefill.date,
        orderNumber: recentRefill.orderNumber,
        status: recentRefill.status,
        notes: recentRefill.notes
      } : null,
      refillHistory: prescription.refillHistory || []
    });
  } catch (error) {
    console.error('Error fetching refill status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refill status' },
      { status: 500 }
    );
  }
}

