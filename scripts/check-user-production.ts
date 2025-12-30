/**
 * Script to check if user exists in production database
 * Usage: DATABASE_URL=<prod-url> npx tsx scripts/check-user-production.ts
 */
import connectDB from '../src/lib/db/mongodb';
import getUser from '../src/lib/db/models/User';
import bcrypt from 'bcryptjs';

const username = 'jmagner';
const password = 'jm71Concierge!';

async function checkUser() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL environment variable not set');
      console.log('\n💡 Usage:');
      console.log('   DATABASE_URL=<your-database-url> npx tsx scripts/check-user-production.ts');
      process.exit(1);
    }

    console.log('🔍 Connecting to database...');
    console.log(`   Database: ${dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
    await connectDB();
    console.log('✅ Database connected\n');

    const User = getUser();
    
    console.log(`🔍 Looking up user: "${username}"`);
    
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
      if (allUsers.length === 0) {
        console.log('   (No users found in database)');
      } else {
        allUsers.forEach((u: any) => {
          console.log(`   - ${u.username} (${u.email}) - ${u.role}`);
        });
      }
      console.log('\n💡 The user may need to be created. Would you like to create it?');
      return;
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Plan: ${user.plan}`);
    console.log(`   Access Mode: ${user.accessMode || 'N/A'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);

    console.log(`\n🔐 Verifying password...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid!');
      console.log('\n✅ User can authenticate successfully');
      console.log('\n💡 If login is still failing, check:');
      console.log('   1. NEXTAUTH_SECRET is set correctly in Vercel');
      console.log('   2. NEXTAUTH_URL matches your deployment URL');
      console.log('   3. Check Vercel function logs for auth errors');
    } else {
      console.log('❌ Password mismatch');
      console.log('\n💡 The password hash in the database does not match.');
      console.log('   Options:');
      console.log('   1. Reset the password');
      console.log('   2. Verify the correct password');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('\n💡 Database authentication failed. Check:');
      console.error('   1. DATABASE_URL is correct');
      console.error('   2. Database credentials are valid');
      console.error('   3. Database allows connections from your IP');
    }
    console.error('\nStack:', error.stack);
  } finally {
    process.exit(0);
  }
}

checkUser();

