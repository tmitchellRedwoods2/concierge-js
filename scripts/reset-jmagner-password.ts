/**
 * Script to reset jmagner user's password
 * 
 * Usage for PRODUCTION:
 *   DATABASE_URL="your-production-mongodb-uri" npx tsx scripts/reset-jmagner-password.ts
 * 
 * Usage for LOCAL:
 *   npx tsx scripts/reset-jmagner-password.ts
 * 
 * This script directly updates the jmagner user's password in the database
 * Useful when the API endpoint isn't accessible
 */
import mongoose from 'mongoose';
import getUser from '../src/lib/db/models/User';
import bcrypt from 'bcryptjs';

const username = 'jmagner';
const newPassword = 'jm71Concierge!';

async function resetPassword() {
  try {
    // Use DATABASE_URL from environment, or fallback to local
    const dbUri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/concierge';
    
    if (!process.env.DATABASE_URL && !process.env.MONGODB_URI) {
      console.warn('⚠️  WARNING: No DATABASE_URL or MONGODB_URI found in environment.');
      console.warn('   This will connect to: mongodb://localhost:27017/concierge');
      console.warn('   For PRODUCTION, set DATABASE_URL before running:\n');
      console.warn('   DATABASE_URL="your-production-uri" npx tsx scripts/reset-jmagner-password.ts\n');
    } else {
      console.log(`📍 Using database: ${dbUri.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs
    }
    
    console.log('🔍 Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('✅ Database connected\n');

    const User = getUser();
    
    // Find user (case-insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!user) {
      console.error(`❌ User "${username}" not found in database`);
      console.log('\n💡 The user may not exist. You may need to create it first.');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);
    console.log(`   Role: ${user.role}, Plan: ${user.plan}\n`);

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed\n');

    // Update password
    console.log('📝 Updating password...');
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!\n');
    console.log('User can now log in with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}\n`);

  } catch (error: any) {
    console.error('❌ Error resetting password:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Duplicate key error');
    }
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

resetPassword();

