#!/usr/bin/env node

/**
 * Google Calendar Diagnostic Script
 * 
 * This script helps diagnose Google Calendar integration issues
 */

console.log('🔍 Google Calendar Integration Diagnostics');
console.log('==========================================');
console.log('');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';
console.log('🌐 Environment:', isVercel ? 'Vercel' : 'Local');
console.log('');

// Check environment variables
const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

console.log('📧 GOOGLE_CALENDAR_CLIENT_EMAIL:');
if (clientEmail) {
  console.log('✅ Set');
  console.log('📧 Value:', clientEmail);
  console.log('📧 Length:', clientEmail.length);
} else {
  console.log('❌ Not set');
}
console.log('');

console.log('🔑 GOOGLE_CALENDAR_PRIVATE_KEY:');
if (privateKey) {
  console.log('✅ Set');
  console.log('🔑 Length:', privateKey.length);
  console.log('🔑 Starts with:', privateKey.substring(0, 30) + '...');
  console.log('🔑 Ends with:', '...' + privateKey.substring(privateKey.length - 30));
  
  // Check format
  const hasBeginMarker = privateKey.includes('-----BEGIN PRIVATE KEY-----');
  const hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----');
  const hasNewlines = privateKey.includes('\\n');
  
  console.log('🔍 Format Analysis:');
  console.log('  - Has BEGIN marker:', hasBeginMarker ? '✅' : '❌');
  console.log('  - Has END marker:', hasEndMarker ? '✅' : '❌');
  console.log('  - Has \\n characters:', hasNewlines ? '✅' : '❌');
  
  if (hasNewlines) {
    const processedKey = privateKey.replace(/\\n/g, '\n');
    console.log('  - Processed length:', processedKey.length);
    console.log('  - Processed has BEGIN:', processedKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌');
    console.log('  - Processed has END:', processedKey.includes('-----END PRIVATE KEY-----') ? '✅' : '❌');
  }
} else {
  console.log('❌ Not set');
}
console.log('');

// Test the calendar service if variables are set
if (clientEmail && privateKey) {
  console.log('🧪 Testing Calendar Service...');
  try {
    const { CalendarService } = require('../src/lib/services/calendar');
    const calendarService = new CalendarService();
    console.log('✅ Calendar service initialized successfully');
  } catch (error) {
    console.log('❌ Calendar service initialization failed:');
    console.log('Error:', error.message);
  }
} else {
  console.log('⚠️  Cannot test calendar service - missing environment variables');
}

console.log('');
console.log('🔧 Troubleshooting Steps:');
console.log('1. If variables are missing, add them to Vercel');
console.log('2. If format is wrong, delete and recreate the variables');
console.log('3. Make sure to wrap private key in quotes');
console.log('4. Use \\n for line breaks in private key');
console.log('5. Redeploy after making changes');
console.log('');

// Check if we can make a test request
if (isVercel) {
  console.log('🌐 Vercel Environment Detected');
  console.log('📡 You can test the API at: /api/test-calendar');
  console.log('🔗 Or visit: /test-calendar page');
} else {
  console.log('💻 Local Environment Detected');
  console.log('📡 Set environment variables locally to test');
  console.log('🔧 Run: export GOOGLE_CALENDAR_CLIENT_EMAIL="your-email"');
  console.log('🔧 Run: export GOOGLE_CALENDAR_PRIVATE_KEY="your-key"');
}
