/**
 * Seed script to create demo user
 * Run with: npx tsx scripts/seed-demo-user.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/concierge';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  plan: { type: String, default: 'basic' },
  netWorth: Number,
  annualIncome: Number,
  goals: [String],
  selectedServices: [String],
}, { timestamps: true });

async function seedDemoUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if demo user already exists
    const existingUser = await User.findOne({ username: 'demo' });
    
    if (existingUser) {
      console.log('ℹ️  Demo user already exists');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Username: demo');
      console.log('🔑 Password: demo123');
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const demoUser = await User.create({
      username: 'demo',
      email: 'demo@concierge.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      plan: 'premium',
      netWorth: 500000,
      annualIncome: 100000,
      goals: ['Wealth Growth', 'Tax Optimization', 'Health Management'],
      selectedServices: ['Expense Tracking', 'Investment Management', 'Health Management', 'Tax Planning'],
    });

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email:', demoUser.email);
    console.log('👤 Username: demo');
    console.log('🔑 Password: demo123');
    console.log('💎 Plan:', demoUser.plan);

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDemoUser();

