import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';

/**
 * GET /api/auth/test
 * Diagnostic endpoint to test database connection and user lookup
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectDB();
    
    // Test user lookup
    const User = getUser();
    const userCount = await User.countDocuments();
    
    // Get a sample user (if any exist)
    const sampleUser = await User.findOne().select('username email role -password');
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        sampleUser: sampleUser ? {
          username: sampleUser.username,
          email: sampleUser.email,
          role: sampleUser.role
        } : null
      },
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}

