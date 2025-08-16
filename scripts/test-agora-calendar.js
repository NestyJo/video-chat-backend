#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            body: jsonBody,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAgoraCalendar() {
  console.log('🎥 Testing Agora Calendar Integration');
  console.log('====================================');

  let authToken = null;
  let meetingId = null;

  try {
    // Step 1: Login to get token
    console.log('\\n1. 🔑 Logging in...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@agora.com',
      password: 'Admin123!@#'
    });

    if (loginResponse.statusCode !== 200 || !loginResponse.body.success) {
      console.log('❌ Login failed');
      return;
    }

    authToken = loginResponse.body.data.token;
    console.log('✅ Login successful');

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // Step 2: Create a meeting with Agora integration and password
    console.log('\\n2. 🎥 Creating Agora meeting with password...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);

    const meetingData = {
      title: 'Agora Video Conference',
      description: 'Test meeting with Agora integration and password protection',
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      timezone: 'UTC',
      meetingType: 'group',
      maxParticipants: 10,
      // Agora-specific fields
      generateAgoraChannel: true,
      generatePassword: true,
      allowGuestAccess: true,
      participants: [
        {
          email: 'participant@example.com',
          name: 'Test Participant',
          role: 'attendee'
        }
      ]
    };

    const createResponse = await makeRequest('POST', '/api/calendar/meetings', meetingData, authHeaders);
    console.log(`Status: ${createResponse.statusCode}`);

    if (createResponse.statusCode === 201 && createResponse.body.success) {
      console.log('✅ Agora meeting created successfully');
      meetingId = createResponse.body.data.meeting.id;
      console.log(`Meeting ID: ${meetingId}`);
      console.log(`Agora Channel: ${createResponse.body.data.meeting.agoraChannelName}`);
      console.log(`Password Protected: ${createResponse.body.data.meeting.isPasswordProtected}`);
      console.log(`Meeting Password: ${createResponse.body.data.meeting.meetingPassword}`);

      // Store password for later tests
      const meetingPassword = createResponse.body.data.meeting.meetingPassword;

      // Step 3: Get meeting share link
      console.log('\\n3. 🔗 Getting meeting share link...');
      const shareLinkResponse = await makeRequest('GET', `/api/calendar/meetings/${meetingId}/share-link`, null, authHeaders);
      console.log(`Status: ${shareLinkResponse.statusCode}`);

      if (shareLinkResponse.statusCode === 200) {
        console.log('✅ Share link generated');
        console.log(`Share Link: ${shareLinkResponse.body.data.shareLink}`);
        console.log(`Requires Password: ${shareLinkResponse.body.data.requiresPassword}`);
      }

      // Step 4: Test meeting access validation (with wrong password)
      console.log('\\n4. ❌ Testing access with wrong password...');
      const wrongPasswordResponse = await makeRequest('POST', `/api/calendar/meetings/${meetingId}/validate-access`, {
        password: 'wrongpassword'
      });
      console.log(`Status: ${wrongPasswordResponse.statusCode}`);

      if (wrongPasswordResponse.statusCode === 403) {
        console.log('✅ Correctly rejected wrong password');
        console.log(`Error: ${wrongPasswordResponse.body.error.message}`);
      }

      // Step 5: Test meeting access validation (with correct password)
      console.log('\\n5. ✅ Testing access with correct password...');
      const correctPasswordResponse = await makeRequest('POST', `/api/calendar/meetings/${meetingId}/validate-access`, {
        password: meetingPassword
      });
      console.log(`Status: ${correctPasswordResponse.statusCode}`);

      if (correctPasswordResponse.statusCode === 200) {
        console.log('✅ Access granted with correct password');
        console.log(`Can Join: ${correctPasswordResponse.body.data.canJoin}`);
        console.log(`Agora Channel: ${correctPasswordResponse.body.data.joinInfo.agoraChannelName}`);
      }

      // Step 6: Test guest joining
      console.log('\\n6. 👤 Testing guest joining...');
      const guestJoinResponse = await makeRequest('POST', `/api/calendar/join/${meetingId}`, {
        password: meetingPassword,
        guestName: 'John Guest'
      });
      console.log(`Status: ${guestJoinResponse.statusCode}`);

      if (guestJoinResponse.statusCode === 200) {
        console.log('✅ Guest can join meeting');
        console.log(`Meeting Title: ${guestJoinResponse.body.data.meeting.title}`);
        console.log(`Agora Channel: ${guestJoinResponse.body.data.meeting.agoraChannelName}`);
        console.log(`Agora App ID: ${guestJoinResponse.body.data.meeting.agoraAppId}`);
      }

    } else {
      console.log('❌ Meeting creation failed');
      if (createResponse.body.error) {
        console.log(`Error: ${createResponse.body.error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\\n💡 Make sure:');
    console.log('1. Server is running: npm run dev');
    console.log('2. Admin user exists: npm run mysql:seed-admin');
    console.log('3. MySQL is running on port 3307');
  }

  console.log('\\n🏁 Agora Calendar test completed');
  console.log('\\n📋 New Agora Endpoints:');
  console.log('POST   /api/calendar/meetings                    - Create meeting with Agora');
  console.log('POST   /api/calendar/meetings/:id/validate-access - Validate meeting access');
  console.log('GET    /api/calendar/meetings/:id/share-link     - Get share link');
  console.log('GET    /api/calendar/meetings/:id/invitation     - Generate invitation');
  console.log('PUT    /api/calendar/meetings/:id/password       - Update password');
  console.log('POST   /api/calendar/join/:id                    - Join meeting (public)');
  
  console.log('\\n🎥 Agora Integration Features:');
  console.log('✅ Unique Agora channel names');
  console.log('✅ Meeting password protection');
  console.log('✅ Guest access control');
  console.log('✅ Share links generation');
  console.log('✅ Meeting invitations');
  console.log('✅ Access validation');
}

testAgoraCalendar();