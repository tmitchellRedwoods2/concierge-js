/**
 * Script to create the jmagner user
 * Usage: npx tsx scripts/create-user-jmagner.ts
 */
import connectDB from '../src/lib/db/mongodb';
import getUser from '../src/lib/db/models/User';
import bcrypt from 'bcryptjs';

const userData = {
  username: 'jmagner',
  email: 'jmagner@concierge.com', // Update with actual email if known
  password: 'jm71Concierge!',
  firstName: 'John',
  lastName: 'Magner',
  plan: 'premium' as const,
  role: 'client' as const,
  accessMode: 'self-service' as const,
};

async function createUser() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    const User = getUser();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${userData.username}$`, 'i') }
    });

    if (existingUser) {
      console.log(`⚠️  User "${userData.username}" already exists:`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log('\n💡 Use the check-user-production.ts script to verify the user');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    console.log('✅ Password hashed\n');

    // Create user
    console.log('📝 Creating user...');
    const newUser = new User({
      ...userData,
      password: hashedPassword,
    });

    await newUser.save();
    console.log('✅ User created successfully!\n');
    console.log('User details:');
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Plan: ${newUser.plan}`);
    console.log(`   Access Mode: ${newUser.accessMode}`);
    console.log('\n✅ User can now log in with:');
    console.log(`   Username: ${userData.username}`);
    console.log(`   Password: ${userData.password}`);

  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 User already exists (duplicate key error)');
      console.error('   Use check-user-production.ts to verify');
    }
    console.error('\nStack:', error.stack);
  } finally {
    process.exit(0);
  }
}

createUser();

