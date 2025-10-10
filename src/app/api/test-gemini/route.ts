import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY?.length || 0;
    const apiKeyPrefix = process.env.GEMINI_API_KEY?.substring(0, 10) || 'none';
    
    // Get all environment variables that contain 'GEMINI' or 'API'
    const relevantEnvVars = Object.keys(process.env)
      .filter(key => key.includes('GEMINI') || key.includes('API'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 10)}...` : 'undefined';
        return acc;
      }, {} as Record<string, string>);

    return NextResponse.json({
      status: 'ok',
      gemini: {
        hasApiKey,
        apiKeyLength,
        apiKeyPrefix,
        relevantEnvVars
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
