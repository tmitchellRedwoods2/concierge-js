#!/usr/bin/env node

/**
 * Local Google Calendar Test Script
 * 
 * This script tests the Google Calendar integration locally
 */

const https = require('https');

// Test the calendar integration
async function testCalendarIntegration() {
  console.log('🧪 Testing Google Calendar Integration...');
  console.log('==========================================');
  console.log('');

  // Check environment variables
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

  console.log('🔍 Environment Variables:');
  console.log('📧 Client Email:', clientEmail ? '✅ Set' : '❌ Missing');
  console.log('🔑 Private Key:', privateKey ? '✅ Set' : '❌ Missing');
  console.log('🔑 Private Key Length:', privateKey?.length || 0);
  console.log('');

  if (!clientEmail || !privateKey) {
    console.log('❌ Missing environment variables!');
    console.log('');
    console.log('📋 To fix this:');
    console.log('1. Set GOOGLE_CALENDAR_CLIENT_EMAIL in your environment');
    console.log('2. Set GOOGLE_CALENDAR_PRIVATE_KEY in your environment');
    console.log('3. Or run: export GOOGLE_CALENDAR_CLIENT_EMAIL="your-email@project.iam.gserviceaccount.com"');
    console.log('4. And run: export GOOGLE_CALENDAR_PRIVATE_KEY="your-private-key"');
    return;
  }

  // Test the calendar service directly
  try {
    console.log('🔧 Testing Calendar Service...');
    
    // Import the calendar service
    const { CalendarService, createAppointmentEvent } = require('../src/lib/services/calendar');
    
    const calendarService = new CalendarService();
    
    // Create a test event
    const testEvent = createAppointmentEvent({
      title: 'Local Test Event',
      date: new Date().toISOString().split('T')[0], // Today
      time: new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[1].substring(0, 5), // 1 hour from now
      duration: 30,
      description: 'This is a local test event',
      location: 'Test Location',
    });

    console.log('📅 Creating test event:', testEvent.summary);
    
    const result = await calendarService.createEvent(testEvent);
    
    if (result.success) {
      console.log('✅ SUCCESS! Calendar event created:');
      console.log('🆔 Event ID:', result.eventId);
      console.log('🔗 Event URL:', result.eventUrl);
      console.log('');
      console.log('🎉 Google Calendar integration is working!');
    } else {
      console.log('❌ FAILED to create calendar event:');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Error testing calendar service:');
    console.log('Error:', error.message);
    console.log('');
    console.log('🔧 Common fixes:');
    console.log('1. Check that your private key is formatted correctly');
    console.log('2. Ensure the service account email is correct');
    console.log('3. Make sure your calendar is shared with the service account');
    console.log('4. Verify the Google Calendar API is enabled');
  }
}

// Run the test
testCalendarIntegration().catch(console.error);
