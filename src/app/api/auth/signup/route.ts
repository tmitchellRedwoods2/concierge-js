/**
 * User signup API endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongodb';
import getUser from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName,
      netWorth,
      annualIncome,
      goals,
      selectedServices 
    } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const User = getUser();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine plan based on net worth and services
    let recommendedPlan = 'basic';
    if (netWorth > 1000000 || selectedServices?.length > 5) {
      recommendedPlan = 'elite';
    } else if (netWorth > 500000 || selectedServices?.length > 3) {
      recommendedPlan = 'premium';
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      plan: recommendedPlan,
      netWorth,
      annualIncome,
      goals,
      selectedServices,
    });

    // Return user data (without password)
    const userData = {
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      plan: newUser.plan,
    };

    return NextResponse.json({
      success: true,
      data: userData,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

