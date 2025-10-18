import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Calendar Debug Endpoint');
    
    // Check environment variables
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        clientEmailValue: clientEmail || 'NOT_SET',
        privateKeyLength: privateKey?.length || 0,
        privateKeyPreview: privateKey?.substring(0, 50) + '...' || 'NOT_SET'
      },
      nodeVersion: process.version,
      platform: process.platform
    };
    
    console.log('Debug info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      message: 'Calendar debug info',
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 Testing Calendar Service Import...');
    
    // Test importing the calendar service
    let importResult;
    try {
      const { CalendarService } = await import('@/lib/services/calendar');
      importResult = 'Calendar service imported successfully';
      console.log('✅ Calendar service import successful');
    } catch (importError) {
      importResult = `Calendar service import failed: ${importError}`;
      console.error('❌ Calendar service import failed:', importError);
    }
    
    // Test creating calendar service instance
    let instanceResult;
    try {
      const { CalendarService } = await import('@/lib/services/calendar');
      const calendarService = new CalendarService();
      instanceResult = 'Calendar service instance created successfully';
      console.log('✅ Calendar service instance created');
    } catch (instanceError) {
      instanceResult = `Calendar service instance failed: ${instanceError}`;
      console.error('❌ Calendar service instance failed:', instanceError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Calendar service test completed',
      results: {
        import: importResult,
        instance: instanceResult
      }
    });
    
  } catch (error) {
    console.error('Calendar service test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Calendar service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
