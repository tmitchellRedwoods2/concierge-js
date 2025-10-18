#!/usr/bin/env node

/**
 * Google Calendar Private Key Fixer for Vercel
 * This script helps format the private key correctly for Vercel environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Google Calendar Private Key Fixer for Vercel');
console.log('===============================================\n');

// Step 1: Check for existing private key files
const possibleKeyFiles = [
  'google-calendar-private-key.json',
  'private-key.json',
  'service-account-key.json',
  'credentials.json'
];

let keyFile = null;
for (const file of possibleKeyFiles) {
  if (fs.existsSync(file)) {
    keyFile = file;
    break;
  }
}

if (!keyFile) {
  console.log('❌ No private key file found.');
  console.log('\n📋 To fix this:');
  console.log('1. Download your service account key from Google Cloud Console');
  console.log('2. Save it as "private-key.json" in this directory');
  console.log('3. Run this script again\n');
  
  console.log('🔗 Google Cloud Console: https://console.cloud.google.com/');
  console.log('   → IAM & Admin → Service Accounts → [Your Service Account] → Keys');
  process.exit(1);
}

try {
  console.log(`✅ Found key file: ${keyFile}`);
  
  // Read and parse the key file
  const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const privateKey = keyData.private_key;
  
  if (!privateKey) {
    console.log('❌ No private_key found in the JSON file');
    process.exit(1);
  }
  
  console.log(`📏 Original key length: ${privateKey.length} characters`);
  
  // Format the key for Vercel (replace actual newlines with \n)
  const vercelFormattedKey = privateKey.replace(/\n/g, '\\n');
  
  console.log(`📏 Vercel formatted length: ${vercelFormattedKey.length} characters`);
  
  // Validate the formatting
  if (!vercelFormattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('❌ Warning: Missing BEGIN marker in formatted key');
  }
  if (!vercelFormattedKey.includes('-----END PRIVATE KEY-----')) {
    console.log('❌ Warning: Missing END marker in formatted key');
  }
  
  console.log('\n🔑 Vercel Environment Variable:');
  console.log('================================');
  console.log('GOOGLE_CALENDAR_PRIVATE_KEY=');
  console.log(vercelFormattedKey);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Copy the formatted key above');
  console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('3. Update GOOGLE_CALENDAR_PRIVATE_KEY with the formatted key');
  console.log('4. Redeploy your application');
  
  console.log('\n✅ The key is now properly formatted for Vercel!');
  
  // Also save the formatted key to a file for easy copying
  const outputFile = 'vercel-formatted-key.txt';
  fs.writeFileSync(outputFile, vercelFormattedKey);
  console.log(`\n💾 Formatted key also saved to: ${outputFile}`);
  
} catch (error) {
  console.log('❌ Error processing key file:', error.message);
  console.log('\n📋 Make sure your key file contains valid JSON with a "private_key" field');
  process.exit(1);
}
