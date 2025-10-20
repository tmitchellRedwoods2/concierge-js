import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
    
    // Don't log the actual private key for security
    const keyPreview = privateKey ? privateKey.substring(0, 50) + '...' : 'Not set';
    const keyLength = privateKey ? privateKey.length : 0;
    const hasNewlines = privateKey ? privateKey.includes('\n') : false;
    const hasEscapedNewlines = privateKey ? privateKey.includes('\\n') : false;
    
    return NextResponse.json({
      success: true,
      debug: {
        clientEmail: clientEmail ? 'Set' : 'Not set',
        privateKeyLength: keyLength,
        privateKeyPreview: keyPreview,
        hasActualNewlines: hasNewlines,
        hasEscapedNewlines: hasEscapedNewlines,
        keyStartsWithBegin: privateKey ? privateKey.startsWith('-----BEGIN PRIVATE KEY-----') : false,
        keyEndsWithEnd: privateKey ? privateKey.endsWith('-----END PRIVATE KEY-----') : false,
        keyLines: privateKey ? privateKey.split('\n').length : 0,
        keyLinesEscaped: privateKey ? privateKey.split('\\n').length : 0,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
