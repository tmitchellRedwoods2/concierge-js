import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const prescriptions = await Prescription.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
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

    const body = await request.json();
    const {
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
      prescribingDoctor,
      pharmacy,
      refillsRemaining,
      notes
    } = body;

    if (!medicationName || !dosage || !frequency || !startDate || !prescribingDoctor || !pharmacy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const prescription = await Prescription.create({
      userId: session.user.id,
      medicationName,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      prescribingDoctor,
      pharmacy,
      refillsRemaining: refillsRemaining || 0,
      notes
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
