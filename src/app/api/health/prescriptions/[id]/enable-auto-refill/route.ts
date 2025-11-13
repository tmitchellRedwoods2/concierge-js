import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';

/**
 * Enable/disable auto-refill for a prescription
 * POST /api/health/prescriptions/[id]/enable-auto-refill
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

    const prescription = await Prescription.findOne({
      _id: params.id,
      userId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const body = await request.json();
    const { enabled, nextAutoRefillDate } = body;

    // Update auto-refill settings
    prescription.autoRefillEnabled = enabled !== undefined ? enabled : true;
    
    if (nextAutoRefillDate) {
      prescription.nextAutoRefillDate = new Date(nextAutoRefillDate);
    } else if (enabled && !prescription.nextAutoRefillDate) {
      // Calculate next refill date if not provided
      const now = new Date();
      const nextRefill = new Date(now);
      // Default to 30 days from now
      nextRefill.setDate(nextRefill.getDate() + 30);
      prescription.nextAutoRefillDate = nextRefill;
    }

    await prescription.save();

    return NextResponse.json({
      success: true,
      prescriptionId: prescription._id.toString(),
      autoRefillEnabled: prescription.autoRefillEnabled,
      nextAutoRefillDate: prescription.nextAutoRefillDate,
      message: `Auto-refill ${prescription.autoRefillEnabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error updating auto-refill settings:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-refill settings' },
      { status: 500 }
    );
  }
}

