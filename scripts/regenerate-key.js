#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Regenerate Private Key');
console.log('========================');

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
  
  // Clean the key completely
  let cleanKey = privateKey.trim();
  
  // Remove any extra whitespace or characters
  cleanKey = cleanKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Ensure proper format
  if (!cleanKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ Key does not start with BEGIN marker');
    console.error('❌ Key starts with:', cleanKey.substring(0, 30));
    process.exit(1);
  }
  
  if (!cleanKey.endsWith('-----END PRIVATE KEY-----')) {
    console.error('❌ Key does not end with END marker');
    console.error('❌ Key ends with:', cleanKey.substring(cleanKey.length - 30));
    process.exit(1);
  }
  
  // Count lines
  const lines = cleanKey.split('\n');
  console.log('📋 Key has', lines.length, 'lines');
  console.log('📋 First line:', lines[0]);
  console.log('📋 Last line:', lines[lines.length - 1]);
  
  // Check for common issues
  if (lines.length < 10) {
    console.error('❌ Key has too few lines - might be truncated');
    process.exit(1);
  }
  
  if (lines.length > 50) {
    console.error('❌ Key has too many lines - might have extra content');
    process.exit(1);
  }
  
  // Check for base64 content
  const base64Lines = lines.slice(1, -1);
  const hasValidBase64 = base64Lines.every(line => 
    line.length === 64 || (line.length > 0 && line.length <= 64)
  );
  
  if (!hasValidBase64) {
    console.error('❌ Key does not have valid base64 content');
    console.error('❌ Base64 lines:', base64Lines.slice(0, 3));
    process.exit(1);
  }
  
  console.log('✅ Key format looks correct');
  console.log('✅ Base64 content is valid');
  
  // Generate different formats
  console.log('\n🎯 FORMAT 1: Raw key (copy exactly):');
  console.log('=====================================');
  console.log(cleanKey);
  console.log('=====================================');
  
  // Try with different line endings
  const windowsKey = cleanKey.replace(/\n/g, '\r\n');
  console.log('\n🎯 FORMAT 2: Windows line endings:');
  console.log('==================================');
  console.log(windowsKey);
  console.log('==================================');
  
  // Try with escaped newlines
  const escapedKey = cleanKey.replace(/\n/g, '\\n');
  console.log('\n🎯 FORMAT 3: Escaped newlines:');
  console.log('==============================');
  console.log(escapedKey);
  console.log('==============================');
  
  console.log('\n📝 TRY THESE IN ORDER:');
  console.log('1. First try FORMAT 1 (raw key)');
  console.log('2. If that fails, try FORMAT 2 (Windows line endings)');
  console.log('3. If that fails, try FORMAT 3 (escaped newlines)');
  console.log('\n⚠️  IMPORTANT: Delete the old key completely before adding the new one!');
  
} catch (error) {
  console.error('❌ Error reading private key:', error.message);
  process.exit(1);
}
