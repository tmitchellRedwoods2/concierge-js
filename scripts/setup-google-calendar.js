#!/usr/bin/env node

/**
 * Google Calendar Setup Script
 * 
 * This script helps format the Google Service Account private key
 * for use in Vercel environment variables.
 */

const fs = require('fs');
const path = require('path');

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

// Format the private key for Vercel environment variables
const formattedPrivateKey = privateKey.replace(/\n/g, '\\n');

console.log('🔧 Google Calendar Setup Helper');
console.log('================================');
console.log('');
console.log('📋 Environment Variables to set in Vercel:');
console.log('');
console.log('1. GOOGLE_CALENDAR_CLIENT_EMAIL');
console.log('   Value: [You need to get this from your Google Cloud Console]');
console.log('   Description: The service account email address');
console.log('');
console.log('2. GOOGLE_CALENDAR_PRIVATE_KEY');
console.log('   Value: (Copy the following exactly)');
console.log('');
console.log('   ' + formattedPrivateKey);
console.log('');
console.log('📝 Instructions:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add the two variables above');
console.log('5. Make sure to set them for Production, Preview, and Development');
console.log('');
console.log('⚠️  Important Notes:');
console.log('- The private key must include the \\n characters as shown');
console.log('- Make sure to wrap the private key value in quotes in Vercel');
console.log('- You still need to get the CLIENT_EMAIL from Google Cloud Console');
console.log('');
console.log('🔗 Next Steps:');
console.log('1. Get the service account email from Google Cloud Console');
console.log('2. Share your Google Calendar with that email address');
console.log('3. Give it "Make changes to events" permission');
console.log('4. Redeploy your application');
console.log('');
console.log('✅ After setup, test by:');
console.log('- Going to the Workflows page');
console.log('- Executing a workflow');
console.log('- Checking if calendar events are created');
