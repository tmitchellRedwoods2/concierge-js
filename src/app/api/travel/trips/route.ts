import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Trip from '@/lib/db/models/Trip';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tripType = searchParams.get('tripType');

    // Build query
    const query: any = { userId: session.user.id };
    if (status) query.status = status;
    if (tripType) query.tripType = tripType;
    
    const trips = await Trip.find(query)
      .sort({ startDate: -1 });

    // Calculate summary statistics
    const now = new Date();
    const upcomingTrips = trips.filter(t => 
      new Date(t.startDate) > now && t.status !== 'CANCELLED'
    );
    const activeTrips = trips.filter(t => 
      new Date(t.startDate) <= now && new Date(t.endDate) >= now && t.status === 'IN_PROGRESS'
    );
    const totalBudget = trips.reduce((sum, t) => sum + (t.estimatedBudget || 0), 0);
    const totalSpent = trips.reduce((sum, t) => sum + (t.actualCost || 0), 0);

    return NextResponse.json({ 
      status: 'ok',
      trips,
      summary: {
        totalTrips: trips.length,
        upcomingTrips: upcomingTrips.length,
        activeTrips: activeTrips.length,
        totalBudget,
        totalSpent
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
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
      tripName,
      description,
      destination,
      destinationCity,
      destinationState,
      destinationCountry,
      startDate,
      endDate,
      tripType,
      status,
      travelers,
      numberOfTravelers,
      estimatedBudget,
      actualCost,
      currency,
      accommodationType,
      transportationMode,
      purpose,
      highlights,
      notes,
      tags
    } = body;

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Create new trip
    const trip = new Trip({
      userId: session.user.id,
      tripName,
      description: description || '',
      destination,
      destinationCity: destinationCity || '',
      destinationState: destinationState || '',
      destinationCountry,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      tripType: tripType || 'LEISURE',
      status: status || 'PLANNING',
      travelers: travelers || [],
      numberOfTravelers: numberOfTravelers || 1,
      estimatedBudget: parseFloat(estimatedBudget) || 0,
      actualCost: parseFloat(actualCost) || 0,
      currency: currency || 'USD',
      accommodationType: accommodationType || undefined,
      transportationMode: transportationMode || undefined,
      purpose: purpose || '',
      highlights: highlights || [],
      notes: notes || '',
      tags: tags || [],
      packingListCompleted: false
    });

    await trip.save();

    return NextResponse.json({ 
      status: 'ok',
      trip,
      message: 'Trip created successfully'
    });
  } catch (error) {
    console.error('Error creating trip:', error);
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
    const tripId = searchParams.get('id');

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    const trip = await Trip.findOneAndDelete({
      _id: tripId,
      userId: session.user.id
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
