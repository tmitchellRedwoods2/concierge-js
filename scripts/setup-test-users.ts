/**
 * Setup Test Users for Selenium Testing
 * 
 * This script creates test users with different roles and access modes
 * for automated Selenium testing of the RBAC system.
 * 
 * Usage:
 *   npm run setup-test-users
 *   or
 *   ts-node scripts/setup-test-users.ts
 */

import { connectDB } from '../src/lib/db/mongodb';
import getUser from '../src/lib/db/models/User';
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
  // Admin User
  {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'AdminTest123!',
    firstName: 'Admin',
    lastName: 'Test',
    role: 'admin',
    plan: 'elite',
  },
  // Self-Service Client
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
  // Hands-Off Client
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
  // AI-Only Client
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
  // Agent User (if needed)
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

async function setupTestUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    const User = getUser();

    console.log('👥 Setting up test users...\n');

    const results = {
      created: [] as string[],
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const userData of TEST_USERS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { username: userData.username },
            { email: userData.email },
          ],
        });

        if (existingUser) {
          // Update existing user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          existingUser.password = hashedPassword;
          existingUser.firstName = userData.firstName;
          existingUser.lastName = userData.lastName;
          existingUser.role = userData.role;
          existingUser.accessMode = userData.accessMode;
          existingUser.plan = userData.plan || 'basic';
          await existingUser.save();

          results.updated.push(`${userData.username} (${userData.email})`);
          console.log(`✅ Updated: ${userData.username} - ${userData.role}${userData.accessMode ? ` (${userData.accessMode})` : ''}`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
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
          console.log(`✅ Created: ${userData.username} - ${userData.role}${userData.accessMode ? ` (${userData.accessMode})` : ''}`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to create/update ${userData.username}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Created: ${results.created.length}`);
    console.log(`   Updated: ${results.updated.length}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (results.created.length > 0) {
      console.log('\n✅ Created Users:');
      results.created.forEach(user => console.log(`   - ${user}`));
    }

    if (results.updated.length > 0) {
      console.log('\n🔄 Updated Users:');
      results.updated.forEach(user => console.log(`   - ${user}`));
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Print credentials for Selenium tests
    console.log('\n📋 Test User Credentials for Selenium:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    TEST_USERS.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}${user.accessMode ? ` (${user.accessMode})` : ''}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Test users setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error setting up test users:', error);
    process.exit(1);
  }
}

// Run the script
setupTestUsers();

