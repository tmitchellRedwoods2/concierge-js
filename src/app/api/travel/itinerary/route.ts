import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import TravelItinerary from '@/lib/db/models/TravelItinerary';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    // Build query
    const query: any = { userId: session.user.id };
    if (tripId) query.tripId = tripId;
    
    const itineraries = await TravelItinerary.find(query)
      .populate('tripId')
      .sort({ date: 1, dayNumber: 1 });

    return NextResponse.json({ 
      status: 'ok',
      itineraries
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
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
      tripId,
      dayNumber,
      date,
      title,
      description,
      activities,
      transportation,
      accommodation,
      estimatedCost,
      actualCost,
      weather,
      notes,
      highlights
    } = body;

    // Create new itinerary day
    const itinerary = new TravelItinerary({
      userId: session.user.id,
      tripId,
      dayNumber: parseInt(dayNumber),
      date: new Date(date),
      title,
      description: description || '',
      activities: activities || [],
      transportation: transportation || undefined,
      accommodation: accommodation || undefined,
      estimatedCost: parseFloat(estimatedCost) || 0,
      actualCost: parseFloat(actualCost) || 0,
      weather: weather || '',
      notes: notes || '',
      highlights: highlights || []
    });

    await itinerary.save();

    return NextResponse.json({ 
      status: 'ok',
      itinerary,
      message: 'Itinerary day added successfully'
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
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
    const itineraryId = searchParams.get('id');

    if (!itineraryId) {
      return NextResponse.json({ error: 'Itinerary ID required' }, { status: 400 });
    }

    const itinerary = await TravelItinerary.findOneAndDelete({
      _id: itineraryId,
      userId: session.user.id
    });

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Itinerary day deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
