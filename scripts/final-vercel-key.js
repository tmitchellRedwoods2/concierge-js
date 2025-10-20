#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final Vercel Key Generator');
console.log('============================');

// Read the private key from the JSON file
const keyPath = path.join(__dirname, '..', 'private-key.json');

if (!fs.existsSync(keyPath)) {
  console.error('❌ private-key.json file not found!');
  process.exit(1);
}

try {
  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const privateKey = keyData.private_key;
  
  if (!privateKey) {
    console.error('❌ No private_key found in JSON file!');
    process.exit(1);
  }
  
  console.log('📋 Original key length:', privateKey.length);
  console.log('📋 Original key preview:', privateKey.substring(0, 50) + '...');
  
  // Clean up the key - remove any extra whitespace or characters
  let cleanKey = privateKey.trim();
  
  // Ensure it starts and ends with the right markers
  if (!cleanKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ Key does not start with BEGIN marker');
    process.exit(1);
  }
  
  if (!cleanKey.endsWith('-----END PRIVATE KEY-----')) {
    console.error('❌ Key does not end with END marker');
    process.exit(1);
  }
  
  // Replace any existing newlines with \n for Vercel
  const vercelKey = cleanKey.replace(/\n/g, '\\n');
  
  console.log('✅ Clean key length:', cleanKey.length);
  console.log('✅ Vercel key length:', vercelKey.length);
  console.log('✅ Vercel key preview:', vercelKey.substring(0, 50) + '...');
  
  console.log('\n🎯 COPY THIS EXACT KEY TO VERCEL:');
  console.log('=====================================');
  console.log(vercelKey);
  console.log('=====================================');
  
  console.log('\n📝 Instructions:');
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Find GOOGLE_CALENDAR_PRIVATE_KEY');
  console.log('3. Click Edit and replace the entire value with the key above');
  console.log('4. Save and wait for redeploy');
  
} catch (error) {
  console.error('❌ Error reading private key:', error.message);
  process.exit(1);
}
