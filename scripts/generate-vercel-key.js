#!/usr/bin/env node

/**
 * Generate Vercel-Compatible Private Key
 * 
 * This script formats the private key correctly for Vercel environment variables
 */

// The private key with actual newlines
const privateKeyWithNewlines = `-----BEGIN PRIVATE KEY-----
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

// Convert to Vercel format (replace actual newlines with \n)
const vercelFormattedKey = privateKeyWithNewlines.replace(/\n/g, '\\n');

console.log('🔧 Vercel-Compatible Private Key');
console.log('=================================');
console.log('');
console.log('📋 Copy this EXACTLY for your GOOGLE_CALENDAR_PRIVATE_KEY in Vercel:');
console.log('');
console.log(vercelFormattedKey);
console.log('');
console.log('⚠️  Important Notes:');
console.log('1. Copy the ENTIRE string above (including the quotes)');
console.log('2. Paste it as the value for GOOGLE_CALENDAR_PRIVATE_KEY');
console.log('3. Make sure to wrap the entire value in quotes in Vercel');
console.log('4. The \\n characters are correct - they will be converted to actual newlines');
console.log('');
console.log('🔍 Key Details:');
console.log('- Length:', vercelFormattedKey.length);
console.log('- Has \\n characters:', vercelFormattedKey.includes('\\n') ? '✅' : '❌');
console.log('- Has BEGIN marker:', vercelFormattedKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌');
console.log('- Has END marker:', vercelFormattedKey.includes('-----END PRIVATE KEY-----') ? '✅' : '❌');
