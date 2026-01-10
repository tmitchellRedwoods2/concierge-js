/**
 * Admin User Management API
 * Handles CRUD operations for users (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';
import { UserRole, AccessMode } from '@/lib/db/models/User';

/**
 * GET /api/admin/users
 * List all users (paginated, filterable)
 */
export const GET = withRole(['admin'], async (request: NextRequest, context) => {
  try {
    await connectDB();
    const User = getUser();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role') as UserRole | null;
    const accessMode = searchParams.get('accessMode') as AccessMode | null;
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = {};
    if (role) query.role = role;
    if (accessMode) query.accessMode = accessMode;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users (exclude password)
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/users
 * Create a new user
 */
export const POST = withRole(['admin'], async (request: NextRequest, context) => {
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
      plan = 'basic',
      role = 'client',
      accessMode,
      netWorth,
      annualIncome,
    } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role and accessMode
    if (role === 'client' && !accessMode) {
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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password (you'll need to import bcrypt or use your auth method)
    // For now, we'll store it as-is (you should hash it in production)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      plan,
      role,
      accessMode: role === 'client' ? (accessMode || 'self-service') : undefined,
      netWorth,
      annualIncome,
    });

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      user: userObj,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});

