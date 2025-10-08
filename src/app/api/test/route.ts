import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasMockAI: true, // Using mock responses - no API needed
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuth: !!process.env.NEXTAUTH_SECRET,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
