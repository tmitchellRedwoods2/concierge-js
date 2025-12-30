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
    const sampleUser = await User.findOne().select('username email role');
    
    // Check for jmagner user specifically
    const jmagnerUser = await User.findOne({ 
      username: { $regex: /^jmagner$/i }
    }).select('username email role');
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        sampleUser: sampleUser ? {
          username: sampleUser.username,
          email: sampleUser.email,
          role: sampleUser.role
        } : null,
        jmagnerUser: jmagnerUser ? {
          username: jmagnerUser.username,
          email: jmagnerUser.email,
          role: jmagnerUser.role,
          exists: true
        } : { exists: false }
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

