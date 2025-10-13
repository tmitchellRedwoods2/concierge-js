import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
    };

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
