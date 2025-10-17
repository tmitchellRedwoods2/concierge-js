#!/usr/bin/env node

/**
 * Fix Google Calendar Credentials Script
 * 
 * This script helps diagnose and fix Google Calendar credential issues
 */

const crypto = require('crypto');

// The private key from your Vercel setup
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC+tp5JEz4Zf7JM
mb1u770k7RhBHT4WK8pvXedPTVtfc8dsX+Phd4fFHYhG1EAEYjoWzSQi2P2IhLMM
UR3BCguKI6fDl0/MwjIsMmvt3QbvJkVYVZV6tHzJqj5peTVm/oodBIpfYsfPutQO
cw11HGtjTCAIkV2v24uN4/sWn/IfIC5nM/VM4G1ZYLrB2l8T4aOsTKR8xZulKuGw
87SuQMQe9L93rpoCZlMzcSIVT4cwKI+xXXCXwQbjNoSHSsJ7gQoTSAUtylJ4us0+
bp1Y6qJGBD27TkCt8AWsrjYU5rBIR7whQ4pS7hxDIefRhtJaWfKMRgttAhj5Qy+5
OGZ5wivpAgMBAAECggEABx/6oGIbZ7z3++QiKgxDWFHnniZ58hPvPhi3l6RydYm1
XtoN660OnGGK0eiZPqtZHmPKGzzY60+CgpiKNcggCmhkGrV4X1Q2/HniwzIcJvWa
psmbFMiRlpV+u5aHaqJiUGIMdbKn992z5plLnKnej4kMc6gopEqzDJlClsO2z4z7
RNfMWh+9mE6yEA6EVFr+IJql9LP1szkm35/op9dT4kJWkBb5TyLcGeKE0erlvGDu
dpzHTh9aJC8BqjwfXpetjNouAbPyoM5mO4bOtIjekqLXkOBZ3nnmUaeyeCsJMEvp
iNpVzTtrrDXeGHygaDLP5fXGPXDBFNH+XfqLiRjgIQKBgQDsxSKmWMhkVq/5VG9F
G/bO7XCh37/kp7Jf5JJ7Fq6aYc/2EWcW3dHQqWDMNRCATd2Stc4gtUch7wPyJilV
YbCOl/hRVt7N5yXeG9N2C7e8Pm0clYVRALa79Cl/Bc62GyYsBfdeZFXSgeghdyxN
4n2YcwWsyv4RKVS3AUL4mtvCmQKBgQDOM+Idf01lxiXCmECeli74Kbbgmq249SOY
qKcTKJXF3CyNITciK/6nhuxa4knZlyjgHsdxHAKDuHQlJN3jfVSi+9lrV11hjN13
fFjSjpDFaDyEoyG5LUCX8znHKooXJ/0QXLHCUnD8B2EkvWp2/6PzV7KczfuTlsQC
qKZ180fV0QKBgAXR9r8WEZ79zoeXfsC5JkEB7zHbeTEaujTHPp6N+S7MVrtaxCj4
vO6fK0T5zPUKdPblRzLgoeYApR0vuPZjV165952wP/vZwcGK95DASvzyn+YC+ur5
1IQcRWTc9K7fTfnpD6KfXsi07srbzhgACExWD36m4sXzOSTigA3yaJKJAoGAeLTu
fI305Mrld9Bgo3UO8b6Zi0mAwHDf8ZFonFJ5umV0vvjeqWZPoAnfeiRVTsap6uiZ
n6Dh5/GmK8g1C+JmFTKQx8FQrLYlPrjP1hIWtTiblJlaOGhBE7IR9ID2bS+/eECK
3lIcSayYNUWceSSU+PIxYJFD39W10EihiRJszsECgYA/gmayCvqDli8iUxS1vtrx
u7YBh2TniAPLC5X+CSktcFomeTwgMtAxiLsnK35IYOeQVms/xM3czYd/Z7/vEpa5
ERnZM8qZjzmtzr2PSuRpxjheCjFl2S+veO1uuys78RdtG6wjTRXFlIYwHmAdOVEZ
EjCDS7tre1FdUc/I67IYdg==
-----END PRIVATE KEY-----`;

console.log('🔧 Google Calendar Credentials Fix');
console.log('==================================');
console.log('');

// Test the private key format
console.log('🔍 Diagnosing the issue...');
console.log('');

try {
  // Test if the private key can be parsed
  const key = crypto.createPrivateKey(privateKey);
  console.log('✅ Private key format is valid');
  console.log('🔑 Key type:', key.asymmetricKeyType);
  console.log('🔑 Key size:', key.asymmetricKeySize);
} catch (error) {
  console.log('❌ Private key format error:', error.message);
}

console.log('');
console.log('📋 Correct Environment Variable Formats:');
console.log('');

// Format 1: With \\n (recommended for Vercel)
const format1 = privateKey.replace(/\n/g, '\\n');
console.log('🔧 Format 1 (Recommended for Vercel):');
console.log('GOOGLE_CALENDAR_PRIVATE_KEY=');
console.log(format1);
console.log('');

// Format 2: With actual newlines (alternative)
const format2 = privateKey;
console.log('🔧 Format 2 (Alternative):');
console.log('GOOGLE_CALENDAR_PRIVATE_KEY=');
console.log(format2);
console.log('');

console.log('⚠️  Common Issues and Solutions:');
console.log('');
console.log('1. ❌ "unsupported" error usually means:');
console.log('   - Private key has wrong line breaks');
console.log('   - Missing quotes around the value');
console.log('   - Extra spaces or characters');
console.log('');
console.log('2. ✅ Try Format 1 first (with \\n)');
console.log('3. ✅ Make sure to wrap the entire value in quotes');
console.log('4. ✅ No extra spaces before/after the key');
console.log('');
console.log('🔧 Step-by-Step Fix:');
console.log('');
console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log('2. Delete the existing GOOGLE_CALENDAR_PRIVATE_KEY');
console.log('3. Add a new one with Format 1 (above)');
console.log('4. Make sure to wrap the entire value in quotes');
console.log('5. Set for Production, Preview, and Development');
console.log('6. Redeploy your application');
console.log('');
console.log('🧪 Test after fixing:');
console.log('- Visit /test-calendar on your live app');
console.log('- Click "Test Calendar Integration"');
console.log('- Check for success message');
