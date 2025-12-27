/**
 * One-Time Test User Setup Endpoint
 * 
 * This endpoint creates test users in the current environment's database.
 * Should only be called once per environment (local, preview, production).
 * 
 * SECURITY: This should be protected or removed after initial setup.
 * For now, it requires admin authentication.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

interface TestUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'admin' | 'agent';
  accessMode?: 'hands-off' | 'self-service' | 'ai-only';
  plan?: string;
}

const TEST_USERS: TestUser[] = [
  {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'AdminTest123!',
    firstName: 'Admin',
    lastName: 'Test',
    role: 'admin',
    plan: 'elite',
  },
  {
    username: 'selfservice_test',
    email: 'selfservice@test.com',
    password: 'SelfService123!',
    firstName: 'Self',
    lastName: 'Service',
    role: 'client',
    accessMode: 'self-service',
    plan: 'premium',
  },
  {
    username: 'handsoff_test',
    email: 'handsoff@test.com',
    password: 'HandsOff123!',
    firstName: 'Hands',
    lastName: 'Off',
    role: 'client',
    accessMode: 'hands-off',
    plan: 'premium',
  },
  {
    username: 'aionly_test',
    email: 'aionly@test.com',
    password: 'AIOnly123!',
    firstName: 'AI',
    lastName: 'Only',
    role: 'client',
    accessMode: 'ai-only',
    plan: 'basic',
  },
  {
    username: 'agent_test',
    email: 'agent@test.com',
    password: 'AgentTest123!',
    firstName: 'Agent',
    lastName: 'Test',
    role: 'agent',
    plan: 'elite',
  },
];

export async function POST(request: NextRequest) {
  try {
    // Require admin role for security
    const authContext = await requireRole(['admin']);
    
    // If no admin exists yet, allow first-time setup (check if any admin exists)
    if (!authContext) {
      await connectDB();
      const User = getUser();
      const adminExists = await User.findOne({ role: 'admin' });
      
      if (!adminExists) {
        // No admin exists, allow setup (first-time only)
        console.log('⚠️ No admin found, allowing first-time test user setup');
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    }

    await connectDB();
    const User = getUser();

    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as string[],
    };

    for (const userData of TEST_USERS) {
      try {
        const existingUser = await User.findOne({
          $or: [
            { username: userData.username },
            { email: userData.email },
          ],
        });

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        if (existingUser) {
          // Update existing user
          existingUser.password = hashedPassword;
          existingUser.firstName = userData.firstName;
          existingUser.lastName = userData.lastName;
          existingUser.role = userData.role;
          existingUser.accessMode = userData.accessMode;
          existingUser.plan = userData.plan || 'basic';
          await existingUser.save();

          results.updated.push(`${userData.username} (${userData.email})`);
        } else {
          // Create new user
          const user = new User({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            accessMode: userData.accessMode,
            plan: userData.plan || 'basic',
          });

          await user.save();
          results.created.push(`${userData.username} (${userData.email})`);
        }
      } catch (error: any) {
        results.errors.push(`${userData.username}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test users setup complete',
      results: {
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
      details: {
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      credentials: TEST_USERS.map(u => ({
        username: u.username,
        email: u.email,
        password: u.password,
        role: u.role,
        accessMode: u.accessMode,
      })),
    });
  } catch (error: any) {
    console.error('Error setting up test users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup test users',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

