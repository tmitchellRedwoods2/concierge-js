import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users/jmagner
 * Check if jmagner user exists and verify authentication
 * NOTE: This endpoint is open for diagnostic purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Allow unauthenticated access for diagnostic purposes
    // This helps troubleshoot login issues
    
    await connectDB();
    const User = getUser();
    
    const username = 'jmagner';
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: 'User not found in database',
        suggestion: 'User may need to be created'
      });
    }

    // Don't return password hash
    return NextResponse.json({
      exists: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        plan: user.plan,
        accessMode: user.accessMode,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'User found in database'
    });
  } catch (error: any) {
    console.error('Error checking jmagner user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check user',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/jmagner
 * Create or update the jmagner user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Require admin authentication for creating users
    const userRole = (session?.user as any)?.role;
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, email, ...otherData } = body;

    await connectDB();
    const User = getUser();
    
    const username = 'jmagner';
    
    // Check if user exists
    let user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (user) {
      // Update existing user
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      if (email) {
        user.email = email;
      }
      Object.assign(user, otherData);
      await user.save();

      return NextResponse.json({
        success: true,
        action: 'updated',
        message: 'User updated successfully',
        user: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // Create new user
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to create user' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = new User({
        username,
        email: email || 'jmagner@concierge.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Magner',
        plan: 'premium',
        role: 'client',
        accessMode: 'self-service',
        ...otherData
      });

      await user.save();

      return NextResponse.json({
        success: true,
        action: 'created',
        message: 'User created successfully',
        user: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error: any) {
    console.error('Error creating/updating jmagner user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create/update user',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

