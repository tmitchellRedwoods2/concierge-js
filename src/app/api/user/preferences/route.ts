import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { UserPreferences } from '@/lib/models/UserPreferences';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const preferences = await UserPreferences.findOne({ userId: session.user.id });
    
    if (!preferences) {
      // Create default preferences
      const defaultPreferences = new UserPreferences({
        userId: session.user.id,
        calendarPreferences: {
          primaryProvider: 'internal',
          syncEnabled: false,
          syncDirection: 'internal-to-external',
          syncSettings: {
            autoSync: true,
            syncInterval: 15,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: true
          }
        }
      });
      
      await defaultPreferences.save();
      return NextResponse.json({ preferences: defaultPreferences });
    }

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { calendarPreferences } = body;

    await connectDB();
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { 
        $set: { 
          calendarPreferences: {
            ...calendarPreferences,
            syncSettings: {
              ...calendarPreferences.syncSettings
            }
          }
        }
      },
      { new: true, upsert: true }
    );

    console.log('✅ User preferences updated:', preferences._id);
    
    return NextResponse.json({ 
      success: true, 
      preferences,
      message: 'Preferences updated successfully' 
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
