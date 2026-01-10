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
      return NextResponse.json({ calendarPreferences: defaultPreferences.calendarPreferences });
    }

    // Log what we're retrieving (without exposing password)
    console.log('📖 Retrieved preferences:', {
      userId: session.user.id,
      hasAppleConfig: !!preferences.calendarPreferences?.appleCalendarConfig,
      appleConfigKeys: preferences.calendarPreferences?.appleCalendarConfig ? Object.keys(preferences.calendarPreferences.appleCalendarConfig) : [],
      appleUsername: preferences.calendarPreferences?.appleCalendarConfig?.username,
      applePasswordLength: preferences.calendarPreferences?.appleCalendarConfig?.password?.length || 0,
      appleServerUrl: preferences.calendarPreferences?.appleCalendarConfig?.serverUrl
    });

    return NextResponse.json({ calendarPreferences: preferences.calendarPreferences });

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
    
    // Log what we're trying to save (without exposing password)
    console.log('💾 Saving calendar preferences:', {
      userId: session.user.id,
      primaryProvider: calendarPreferences?.primaryProvider,
      syncEnabled: calendarPreferences?.syncEnabled,
      hasAppleConfig: !!calendarPreferences?.appleCalendarConfig,
      appleConfigKeys: calendarPreferences?.appleCalendarConfig ? Object.keys(calendarPreferences.appleCalendarConfig) : [],
      appleUsername: calendarPreferences?.appleCalendarConfig?.username,
      applePasswordLength: calendarPreferences?.appleCalendarConfig?.password?.length || 0,
      appleServerUrl: calendarPreferences?.appleCalendarConfig?.serverUrl,
      appleCalendarPath: calendarPreferences?.appleCalendarConfig?.calendarPath
    });

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { 
        $set: { 
          'calendarPreferences': calendarPreferences
        }
      },
      { new: true, upsert: true }
    );

    // Log what was actually saved
    console.log('✅ User preferences updated:', {
      _id: preferences._id,
      hasAppleConfig: !!preferences.calendarPreferences?.appleCalendarConfig,
      appleConfigKeys: preferences.calendarPreferences?.appleCalendarConfig ? Object.keys(preferences.calendarPreferences.appleCalendarConfig) : [],
      appleUsername: preferences.calendarPreferences?.appleCalendarConfig?.username,
      applePasswordLength: preferences.calendarPreferences?.appleCalendarConfig?.password?.length || 0
    });
    
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
