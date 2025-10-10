import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import LegalAppointment from '@/lib/db/models/LegalAppointment';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');
    const appointmentType = searchParams.get('appointmentType');

    // Build query
    const query: any = { userId: session.user.id };
    if (caseId) query.caseId = caseId;
    if (status) query.status = status;
    if (appointmentType) query.appointmentType = appointmentType;
    
    const appointments = await LegalAppointment.find(query)
      .populate('caseId')
      .sort({ startDateTime: 1 });

    // Calculate summary statistics
    const now = new Date();
    const upcomingAppointments = appointments.filter(a => 
      new Date(a.startDateTime) > now && a.status !== 'CANCELLED'
    );
    const todayAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.startDateTime);
      return appointmentDate.toDateString() === now.toDateString() && a.status !== 'CANCELLED';
    });

    return NextResponse.json({ 
      status: 'ok',
      appointments,
      summary: {
        totalAppointments: appointments.length,
        upcomingAppointments: upcomingAppointments.length,
        todayAppointments: todayAppointments.length
      }
    });
  } catch (error) {
    console.error('Error fetching legal appointments:', error);
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
      caseId,
      title,
      description,
      appointmentType,
      startDateTime,
      endDateTime,
      duration,
      timeZone,
      location,
      attendees,
      status,
      preparationNotes,
      agenda,
      notes
    } = body;

    // Create new legal appointment
    const appointment = new LegalAppointment({
      userId: session.user.id,
      caseId: caseId || undefined,
      title,
      description: description || '',
      appointmentType,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      duration: parseInt(duration) || 60,
      timeZone: timeZone || 'America/New_York',
      location: location || {
        type: 'IN_PERSON',
        address: ''
      },
      attendees: attendees || [],
      status: status || 'SCHEDULED',
      preparationNotes: preparationNotes || '',
      agenda: agenda || [],
      notes: notes || ''
    });

    await appointment.save();

    return NextResponse.json({ 
      status: 'ok',
      appointment,
      message: 'Appointment scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating legal appointment:', error);
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
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    const appointment = await LegalAppointment.findOneAndDelete({
      _id: appointmentId,
      userId: session.user.id
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');
    const body = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    const appointment = await LegalAppointment.findOneAndUpdate(
      { _id: appointmentId, userId: session.user.id },
      { $set: body },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      appointment,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
