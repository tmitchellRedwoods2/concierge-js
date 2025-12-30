/**
 * Preview Environment User Setup Endpoint
 * 
 * This endpoint creates essential users (like jmagner) in preview environments.
 * Preview deployments use separate databases from production, so users need to be created.
 * 
 * SECURITY: This should only be accessible in preview environments or with admin auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

interface PreviewUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'admin' | 'agent';
  accessMode?: 'hands-off' | 'self-service' | 'ai-only';
  plan?: string;
}

// Essential users that should exist in all environments
const PREVIEW_USERS: PreviewUser[] = [
  {
    username: 'jmagner',
    email: 'jmagner@concierge.com',
    password: 'jm71Concierge!',
    firstName: 'John',
    lastName: 'Magner',
    role: 'client',
    accessMode: 'self-service',
    plan: 'premium',
  },
  // Add other essential users here
];

/**
 * POST /api/admin/setup-preview-users
 * Create essential users in preview environment
 */
export async function POST(request: NextRequest) {
  try {
    // Check if we're in a preview environment
    const isPreview = process.env.VERCEL_ENV === 'preview' || 
                     process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
                     process.env.NODE_ENV === 'development';

    // For security, in production require admin auth
    // In preview/dev, allow unauthenticated access for setup
    if (!isPreview) {
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required in production' },
          { status: 401 }
        );
      }
    }

    await connectDB();
    const User = getUser();

    const results = [];
    const errors = [];

    for (const userData of PREVIEW_USERS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          username: { $regex: new RegExp(`^${userData.username}$`, 'i') }
        });

        if (existingUser) {
          results.push({
            username: userData.username,
            action: 'skipped',
            message: 'User already exists'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          accessMode: userData.accessMode,
          plan: userData.plan || 'premium',
        });

        await newUser.save();

        results.push({
          username: userData.username,
          action: 'created',
          message: 'User created successfully'
        });
      } catch (error: any) {
        errors.push({
          username: userData.username,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      message: `Setup complete for ${results.length} user(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error setting up preview users:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup preview users',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/setup-preview-users
 * Check which preview users exist
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const User = getUser();

    const status = [];

    for (const userData of PREVIEW_USERS) {
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${userData.username}$`, 'i') }
      });

      status.push({
        username: userData.username,
        exists: !!user,
        email: user?.email || userData.email,
        role: user?.role || userData.role
      });
    }

    return NextResponse.json({
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      users: status,
      message: 'Preview user status check complete'
    });
  } catch (error: any) {
    console.error('Error checking preview users:', error);
    return NextResponse.json(
      {
        error: 'Failed to check preview users',
        message: error.message
      },
      { status: 500 }
    );
  }
}

