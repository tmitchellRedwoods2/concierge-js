#!/usr/bin/env node

/**
 * Script to help format the Google Calendar private key for Vercel environment variables
 * 
 * The issue: Vercel environment variables need \n characters, not actual newlines
 * The error: error:1E08010C:DECODER routines::unsupported
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Google Calendar Private Key Formatter for Vercel');
console.log('==================================================\n');

// Check if private key file exists
const privateKeyPath = path.join(__dirname, '..', 'google-calendar-private-key.json');
const privateKeyPath2 = path.join(__dirname, '..', 'private-key.json');
const privateKeyPath3 = path.join(process.cwd(), 'google-calendar-private-key.json');

let privateKeyFile = null;
if (fs.existsSync(privateKeyPath)) {
  privateKeyFile = privateKeyPath;
} else if (fs.existsSync(privateKeyPath2)) {
  privateKeyFile = privateKeyPath2;
} else if (fs.existsSync(privateKeyPath3)) {
  privateKeyFile = privateKeyPath3;
}

if (!privateKeyFile) {
  console.log('❌ No private key file found. Please provide your private key:');
  console.log('   Expected files:');
  console.log('   - google-calendar-private-key.json');
  console.log('   - private-key.json');
  console.log('   - Or paste your private key below\n');
  
  console.log('📋 Instructions:');
  console.log('1. Copy your private key from Google Cloud Console');
  console.log('2. Create a file called "private-key.json" in the project root');
  console.log('3. Paste the private key content into that file');
  console.log('4. Run this script again\n');
  
  process.exit(1);
}

try {
  const privateKeyData = JSON.parse(fs.readFileSync(privateKeyFile, 'utf8'));
  const privateKey = privateKeyData.private_key;
  
  if (!privateKey) {
    console.log('❌ No private_key found in the JSON file');
    process.exit(1);
  }
  
  console.log('✅ Private key file found and parsed');
  console.log(`📏 Original key length: ${privateKey.length} characters`);
  
  // Convert actual newlines to \n for Vercel
  const vercelFormattedKey = privateKey.replace(/\n/g, '\\n');
  
  console.log(`📏 Vercel formatted length: ${vercelFormattedKey.length} characters`);
  console.log('\n🔑 Vercel Environment Variable Format:');
  console.log('=====================================');
  console.log('GOOGLE_CALENDAR_PRIVATE_KEY=');
  console.log(vercelFormattedKey);
  console.log('\n📋 Next Steps:');
  console.log('1. Copy the formatted key above');
  console.log('2. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
  console.log('3. Update GOOGLE_CALENDAR_PRIVATE_KEY with the formatted key');
  console.log('4. Redeploy your application');
  console.log('\n✅ The key is now properly formatted for Vercel!');
  
} catch (error) {
  console.log('❌ Error reading private key file:', error.message);
  console.log('\n📋 Make sure your private key file contains valid JSON with a "private_key" field');
  process.exit(1);
}
