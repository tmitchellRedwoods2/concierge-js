#!/usr/bin/env node

/**
 * Test Google Calendar API Integration
 * 
 * This script tests the calendar integration by making a POST request
 */

const https = require('https');

// Function to make HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCalendarIntegration() {
  console.log('🧪 Testing Google Calendar Integration');
  console.log('=====================================');
  console.log('');

  // Try different possible URLs
  const possibleUrls = [
    'https://concierge-js.vercel.app/api/test-calendar',
    'https://concierge-js-git-main-tmitchellredwoods2.vercel.app/api/test-calendar',
    'https://concierge-js-tmitchellredwoods2.vercel.app/api/test-calendar'
  ];

  for (const url of possibleUrls) {
    console.log(`🔍 Testing URL: ${url}`);
    
    try {
      // Test GET request first
      console.log('📡 Making GET request...');
      const getResponse = await makeRequest(url, 'GET');
      console.log('📊 GET Response Status:', getResponse.status);
      console.log('📊 GET Response:', JSON.stringify(getResponse.data, null, 2));
      console.log('');

      // Test POST request
      console.log('📡 Making POST request...');
      const postResponse = await makeRequest(url, 'POST', {});
      console.log('📊 POST Response Status:', postResponse.status);
      console.log('📊 POST Response:', JSON.stringify(postResponse.data, null, 2));
      console.log('');

      if (postResponse.status === 200 && postResponse.data.success) {
        console.log('✅ SUCCESS! Calendar integration is working!');
        console.log('🎉 Event created:', postResponse.data.eventId);
        return;
      } else if (postResponse.status === 200 && !postResponse.data.success) {
        console.log('❌ Calendar integration failed:');
        console.log('Error:', postResponse.data.error);
        console.log('Details:', postResponse.data.details);
      } else {
        console.log('❌ Request failed with status:', postResponse.status);
      }

    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    console.log('---');
  }

  console.log('');
  console.log('🔧 Troubleshooting Steps:');
  console.log('1. Check that your app is deployed and accessible');
  console.log('2. Verify environment variables are set in Vercel');
  console.log('3. Make sure the private key format is correct');
  console.log('4. Check that your Google Calendar is shared with the service account');
  console.log('');
  console.log('📋 Manual Test:');
  console.log('1. Visit your app: https://your-app.vercel.app/test-calendar');
  console.log('2. Click "Test Calendar Integration" button');
  console.log('3. Check the response');
}

// Run the test
testCalendarIntegration().catch(console.error);
