#!/usr/bin/env node

/**
 * Generate the EXACT private key format needed for Vercel
 * This script will create the perfect format for Vercel environment variables
 */

const fs = require('fs');

console.log('🔧 Vercel Private Key Generator');
console.log('================================\n');

// Check for private key file
const keyFile = 'private-key.json';
if (!fs.existsSync(keyFile)) {
  console.log('❌ No private-key.json file found.');
  console.log('\n📋 To fix this:');
  console.log('1. Download your service account key from Google Cloud Console');
  console.log('2. Save it as "private-key.json" in this directory');
  console.log('3. Run this script again\n');
  process.exit(1);
}

try {
  const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const privateKey = keyData.private_key;
  
  if (!privateKey) {
    console.log('❌ No private_key found in the JSON file');
    process.exit(1);
  }
  
  console.log('✅ Found private key');
  console.log(`📏 Original length: ${privateKey.length} characters`);
  
  // Create the EXACT format Vercel needs
  const vercelKey = privateKey.replace(/\n/g, '\\n');
  
  console.log(`📏 Vercel format length: ${vercelKey.length} characters`);
  
  // Save to file for easy copying
  fs.writeFileSync('vercel-key-exact.txt', vercelKey);
  
  console.log('\n🔑 EXACT Vercel Environment Variable:');
  console.log('=====================================');
  console.log('GOOGLE_CALENDAR_PRIVATE_KEY=');
  console.log(vercelKey);
  
  console.log('\n📋 CRITICAL STEPS:');
  console.log('1. Copy the ENTIRE key above (including the GOOGLE_CALENDAR_PRIVATE_KEY= line)');
  console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('3. Find GOOGLE_CALENDAR_PRIVATE_KEY and EDIT it');
  console.log('4. REPLACE the entire value with the key above (without the variable name)');
  console.log('5. Save and redeploy');
  
  console.log('\n💾 Key also saved to: vercel-key-exact.txt');
  console.log('✅ This format will definitely work in Vercel!');
  
} catch (error) {
  console.log('❌ Error processing key file:', error.message);
  process.exit(1);
}
