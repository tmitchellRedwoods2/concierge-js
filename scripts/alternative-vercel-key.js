#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Alternative Vercel Private Key Format');
console.log('=======================================');

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
  
  // Clean the key
  let cleanKey = privateKey.trim();
  
  // Method 1: Try with actual newlines (not escaped)
  console.log('\n🎯 METHOD 1: Copy this key with ACTUAL newlines:');
  console.log('================================================');
  console.log(cleanKey);
  console.log('================================================');
  
  // Method 2: Try with double-escaped newlines
  const doubleEscapedKey = cleanKey.replace(/\n/g, '\\\\n');
  console.log('\n🎯 METHOD 2: Copy this key with double-escaped newlines:');
  console.log('=======================================================');
  console.log(doubleEscapedKey);
  console.log('=======================================================');
  
  // Method 3: Try with single quotes and newlines
  const singleQuoteKey = cleanKey.replace(/\n/g, '\\n');
  console.log('\n🎯 METHOD 3: Copy this key with single-escaped newlines:');
  console.log('=======================================================');
  console.log(singleQuoteKey);
  console.log('=======================================================');
  
  console.log('\n📝 TRY THESE IN ORDER:');
  console.log('1. First try METHOD 1 (actual newlines)');
  console.log('2. If that fails, try METHOD 2 (double-escaped)');
  console.log('3. If that fails, try METHOD 3 (single-escaped)');
  console.log('\n⚠️  IMPORTANT: Delete the old key completely before adding the new one!');
  
} catch (error) {
  console.error('❌ Error reading private key:', error.message);
  process.exit(1);
}
