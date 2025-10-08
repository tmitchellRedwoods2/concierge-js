import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
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
