import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import TravelBooking from '@/lib/db/models/TravelBooking';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    const bookingType = searchParams.get('bookingType');

    // Build query
    const query: any = { userId: session.user.id };
    if (tripId) query.tripId = tripId;
    if (bookingType) query.bookingType = bookingType;
    
    const bookings = await TravelBooking.find(query)
      .populate('tripId')
      .sort({ bookingDate: -1 });

    return NextResponse.json({ 
      status: 'ok',
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
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

    // Create new booking
    const booking = new TravelBooking({
      userId: session.user.id,
      ...body,
      cost: parseFloat(body.cost) || 0
    });

    await booking.save();

    return NextResponse.json({ 
      status: 'ok',
      booking,
      message: 'Booking added successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
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
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const booking = await TravelBooking.findOneAndDelete({
      _id: bookingId,
      userId: session.user.id
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
