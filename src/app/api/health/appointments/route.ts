import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import Appointment from '@/lib/db/models/Appointment';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const appointments = await Appointment.find({ userId: session.user.id })
      .sort({ appointmentDate: 1 });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
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
      doctorName,
      specialty,
      appointmentType,
      appointmentDate,
      appointmentTime,
      location,
      address,
      phoneNumber,
      notes
    } = body;

    if (!doctorName || !specialty || !appointmentType || !appointmentDate || !appointmentTime || !location || !address || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const appointment = await Appointment.create({
      userId: session.user.id,
      doctorName,
      specialty,
      appointmentType,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      location,
      address,
      phoneNumber,
      notes
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
