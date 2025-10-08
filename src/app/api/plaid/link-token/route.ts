import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLinkToken } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkToken = await createLinkToken(session.user.id);
    
    return NextResponse.json({ link_token: linkToken });
  } catch (error) {
    console.error('Link token error:', error);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
