/**
 * Verify Test Users
 * Checks if test users exist and can authenticate
 */
import { connectDB } from '../src/lib/db/mongodb';
import getUser from '../src/lib/db/models/User';
import bcrypt from 'bcryptjs';

const TEST_CREDENTIALS = [
  { username: 'admin_test', password: 'AdminTest123!' },
  { username: 'selfservice_test', password: 'SelfService123!' },
  { username: 'handsoff_test', password: 'HandsOff123!' },
  { username: 'aionly_test', password: 'AIOnly123!' },
  { username: 'agent_test', password: 'AgentTest123!' },
];

async function verifyTestUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    const User = getUser();

    console.log('🔍 Verifying test users...\n');

    for (const creds of TEST_CREDENTIALS) {
      try {
        // Find user by username
        const user = await User.findOne({ username: creds.username });
        
        if (!user) {
          console.log(`❌ ${creds.username}: User not found in database`);
          continue;
        }

        console.log(`✅ ${creds.username}: User found`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Access Mode: ${user.accessMode || 'N/A'}`);
        console.log(`   - Has Password: ${user.password ? 'Yes' : 'No'}`);
        console.log(`   - Password Length: ${user.password?.length || 0}`);

        // Test password
        if (user.password) {
          const isValid = await bcrypt.compare(creds.password, user.password);
          if (isValid) {
            console.log(`   - Password: ✅ Valid`);
          } else {
            console.log(`   - Password: ❌ Invalid (password mismatch)`);
            console.log(`   - Attempting to fix password...`);
            
            // Fix the password
            const hashedPassword = await bcrypt.hash(creds.password, 10);
            user.password = hashedPassword;
            await user.save();
            console.log(`   - Password: ✅ Fixed and saved`);
          }
        } else {
          console.log(`   - Password: ❌ Missing`);
          console.log(`   - Setting password...`);
          const hashedPassword = await bcrypt.hash(creds.password, 10);
          user.password = hashedPassword;
          await user.save();
          console.log(`   - Password: ✅ Set and saved`);
        }

        // Verify required fields
        if (!user.firstName || !user.lastName) {
          console.log(`   ⚠️  Missing name fields`);
        }

        console.log('');
      } catch (error: any) {
        console.error(`❌ Error checking ${creds.username}:`, error.message);
        console.log('');
      }
    }

    console.log('✨ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

verifyTestUsers();

