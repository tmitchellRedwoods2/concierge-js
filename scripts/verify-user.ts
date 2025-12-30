/**
 * Script to verify user exists and can authenticate
 * Run with: npx tsx scripts/verify-user.ts
 */
import connectDB from '../src/lib/db/mongodb';
import getUser from '../src/lib/db/models/User';
import bcrypt from 'bcryptjs';

const username = 'jmagner';
const password = 'jm71Concierge!';

async function verifyUser() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    const User = getUser();
    
    console.log(`\n🔍 Looking up user: "${username}"`);
    
    // Try exact match first
    let user = await User.findOne({ username });
    
    if (!user) {
      console.log('⚠️  Exact match not found, trying case-insensitive...');
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') }
      });
    }

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📋 Available users:');
      const allUsers = await User.find().select('username email role');
      allUsers.forEach((u: any) => {
        console.log(`  - ${u.username} (${u.email}) - ${u.role}`);
      });
      return;
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Plan: ${user.plan}`);
    console.log(`   Access Mode: ${user.accessMode || 'N/A'}`);

    console.log(`\n🔐 Verifying password...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid!');
      console.log('\n✅ User can authenticate successfully');
    } else {
      console.log('❌ Password mismatch');
      console.log('\n💡 The password hash in the database does not match the provided password.');
      console.log('   This could mean:');
      console.log('   1. The password was changed');
      console.log('   2. The password was not hashed correctly when created');
      console.log('   3. The password provided is incorrect');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

verifyUser();

