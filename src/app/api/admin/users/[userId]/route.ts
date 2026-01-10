/**
 * Admin User Management API - Individual User Operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';
import { UserRole, AccessMode } from '@/lib/db/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/admin/users/[userId]
 * Get a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authContext = await requireRole(['admin']);
  
  if (!authContext) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }

  const { userId } = await params;
  try {
    await connectDB();
    const User = getUser();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[userId]
 * Update a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authContext = await requireRole(['admin']);
  
  if (!authContext) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }

  const { userId: userIdParam } = await params;
  try {
    await connectDB();
    const User = getUser();

    const body = await request.json();
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      plan,
      role,
      accessMode,
      netWorth,
      annualIncome,
    } = body;

    const user = await User.findById(userIdParam);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate role and accessMode
    if (role === 'client' && !accessMode && user.role !== 'client') {
      return NextResponse.json(
        { error: 'accessMode is required for client role' },
        { status: 400 }
      );
    }
    if (role !== 'client' && accessMode) {
      return NextResponse.json(
        { error: 'accessMode can only be set for client role' },
        { status: 400 }
      );
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      const bcrypt = await import('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (plan) user.plan = plan;
    if (role) user.role = role;
    if (role === 'client') {
      user.accessMode = accessMode || user.accessMode || 'self-service';
    } else {
      user.accessMode = undefined;
    }
    if (netWorth !== undefined) user.netWorth = netWorth;
    if (annualIncome !== undefined) user.annualIncome = annualIncome;

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      user: userObj,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authContext = await requireRole(['admin']);
  
  if (!authContext) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }

  const { userId: userIdParam } = await params;
  try {
    await connectDB();
    const User = getUser();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(userIdParam);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (user._id.toString() === authContext.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(userIdParam);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

