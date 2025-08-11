// API Test for Google Meet Integration
// This script demonstrates how to test the Google Meet endpoints

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testMeetingId = '';

// Test user credentials (make sure these exist in your database)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function runAPITests() {
  console.log('🧪 Testing Google Meet API Integration\n');

  try {
    // Step 1: Login to get auth token
    console.log('1. 🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log('   ✅ Login successful\n');

    // Step 2: Create a meeting with Google Meet
    console.log('2. 📅 Creating meeting with Google Meet...');
    const meetingData = {
      title: 'API Test Meeting',
      description: 'Testing Google Meet integration via API',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      participants: ['participant1@example.com', 'participant2@example.com']
    };

    const createResponse = await axios.post(`${BASE_URL}/meetings`, meetingData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testMeetingId = createResponse.data._id;
    console.log('   ✅ Meeting created successfully');
    console.log(`   📍 Meeting ID: ${testMeetingId}`);
    console.log(`   🎥 Google Meet Link: ${createResponse.data.googleMeetLink}`);
    console.log(`   🆔 Meeting Code: ${createResponse.data.meetingId}\n`);

    // Step 3: Get meeting details
    console.log('3. 📋 Fetching meeting details...');
    const detailsResponse = await axios.get(`${BASE_URL}/meetings/${testMeetingId}/meet-details`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('   ✅ Meeting details retrieved');
    console.log(`   🎥 Google Meet Link: ${detailsResponse.data.googleMeetLink}`);
    console.log(`   📅 Calendar URL: ${detailsResponse.data.calendarUrl}\n`);

    // Step 4: Regenerate Google Meet link
    console.log('4. 🔄 Regenerating Google Meet link...');
    const regenerateResponse = await axios.patch(`${BASE_URL}/meetings/${testMeetingId}/regenerate-meet`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('   ✅ Google Meet link regenerated');
    console.log(`   🎥 New Google Meet Link: ${regenerateResponse.data.googleMeetLink}`);
    console.log(`   🆔 New Meeting Code: ${regenerateResponse.data.meetingId}\n`);

    // Step 5: Get all meetings
    console.log('5. 📝 Fetching all meetings...');
    const allMeetingsResponse = await axios.get(`${BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const meetingsWithGoogleMeet = allMeetingsResponse.data.filter(m => m.googleMeetLink);
    console.log(`   ✅ Found ${meetingsWithGoogleMeet.length} meetings with Google Meet links\n`);

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('• ✅ User authentication');
    console.log('• ✅ Meeting creation with Google Meet');
    console.log('• ✅ Google Meet details retrieval');
    console.log('• ✅ Google Meet link regeneration');
    console.log('• ✅ Meeting listing with Google Meet info');

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error === 'User not found') {
      console.log('\n💡 Tip: Make sure to create a test user first:');
      console.log('POST /api/auth/signup with:', JSON.stringify(testUser, null, 2));
    }
  }
}

// Helper function to display meeting invitation preview
function displayInvitationPreview(meeting) {
  console.log('\n📧 Email Invitation Preview:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Subject: 📅 Meeting Invitation: ${meeting.title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 ${meeting.title}`);
  console.log(`📍 When: ${new Date(meeting.startTime).toLocaleString()}`);
  console.log(`📝 Description: ${meeting.description}`);
  console.log(`🎥 Join Google Meet: ${meeting.googleMeetLink}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the tests
if (require.main === module) {
  runAPITests();
}

module.exports = { runAPITests };
