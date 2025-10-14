import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLinkToken } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Plaid integration for demo purposes
    // In production, this would use real Plaid credentials
    const mockLinkToken = `link-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({ 
      link_token: mockLinkToken,
      mock: true,
      message: 'Mock Plaid integration active'
    });
  } catch (error) {
    console.error('Link token error:', error);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
