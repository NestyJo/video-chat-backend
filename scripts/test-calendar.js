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

async function testCalendarAPI() {
  console.log('📅 Testing Calendar API');
  console.log('=======================');

  let authToken = null;

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

    // Step 2: Create a meeting
    console.log('\\n2. 📅 Creating a meeting...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0); // 3 PM tomorrow

    const meetingData = {
      title: 'Team Standup Meeting',
      description: 'Daily team standup to discuss progress and blockers',
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      timezone: 'UTC',
      location: 'Conference Room A',
      meetingType: 'group',
      maxParticipants: 10,
      participants: [
        {
          email: 'participant1@example.com',
          name: 'John Doe',
          role: 'attendee'
        }
      ]
    };

    const createResponse = await makeRequest('POST', '/api/calendar/meetings', meetingData, authHeaders);
    console.log(`Status: ${createResponse.statusCode}`);

    if (createResponse.statusCode === 201 && createResponse.body.success) {
      console.log('✅ Meeting created successfully');
      console.log(`Meeting ID: ${createResponse.body.data.meeting.id}`);
      console.log(`Title: ${createResponse.body.data.meeting.title}`);
      
      const meetingId = createResponse.body.data.meeting.id;

      // Step 3: Get meeting details
      console.log('\\n3. 📋 Getting meeting details...');
      const detailsResponse = await makeRequest('GET', `/api/calendar/meetings/${meetingId}`, null, authHeaders);
      console.log(`Status: ${detailsResponse.statusCode}`);

      if (detailsResponse.statusCode === 200) {
        console.log('✅ Meeting details retrieved');
        console.log(`Participants: ${detailsResponse.body.data.participants.length}`);
      }

      // Step 4: Get all meetings
      console.log('\\n4. 📅 Getting all meetings...');
      const meetingsResponse = await makeRequest('GET', '/api/calendar/meetings', null, authHeaders);
      console.log(`Status: ${meetingsResponse.statusCode}`);

      if (meetingsResponse.statusCode === 200) {
        console.log('✅ Meetings retrieved');
        console.log(`Total meetings: ${meetingsResponse.body.data.count}`);
      }

      // Step 5: Get upcoming meetings
      console.log('\\n5. ⏰ Getting upcoming meetings...');
      const upcomingResponse = await makeRequest('GET', '/api/calendar/meetings/upcoming', null, authHeaders);
      console.log(`Status: ${upcomingResponse.statusCode}`);

      if (upcomingResponse.statusCode === 200) {
        console.log('✅ Upcoming meetings retrieved');
        console.log(`Upcoming meetings: ${upcomingResponse.body.data.count}`);
      }

      // Step 6: Get available time slots
      console.log('\\n6. 🕐 Getting available time slots...');
      const today = new Date().toISOString().split('T')[0];
      const slotsResponse = await makeRequest('GET', `/api/calendar/availability?date=${today}&duration=60`, null, authHeaders);
      console.log(`Status: ${slotsResponse.statusCode}`);

      if (slotsResponse.statusCode === 200) {
        console.log('✅ Available time slots retrieved');
        const availableSlots = slotsResponse.body.data.timeSlots.filter(slot => slot.available);
        console.log(`Available slots: ${availableSlots.length}`);
      }

      // Step 7: Update meeting
      console.log('\\n7. ✏️  Updating meeting...');
      const updateData = {
        title: 'Updated Team Standup Meeting',
        description: 'Updated description for the daily standup'
      };
      const updateResponse = await makeRequest('PUT', `/api/calendar/meetings/${meetingId}`, updateData, authHeaders);
      console.log(`Status: ${updateResponse.statusCode}`);

      if (updateResponse.statusCode === 200) {
        console.log('✅ Meeting updated successfully');
      }

      // Step 8: Get calendar overview
      console.log('\\n8. 📊 Getting calendar overview...');
      const overviewResponse = await makeRequest('GET', '/api/calendar/overview', null, authHeaders);
      console.log(`Status: ${overviewResponse.statusCode}`);

      if (overviewResponse.statusCode === 200) {
        console.log('✅ Calendar overview retrieved');
        console.log(`Total meetings this month: ${overviewResponse.body.data.totalMeetings}`);
      }

      // Step 9: Cancel meeting
      console.log('\\n9. ❌ Cancelling meeting...');
      const cancelResponse = await makeRequest('DELETE', `/api/calendar/meetings/${meetingId}`, null, authHeaders);
      console.log(`Status: ${cancelResponse.statusCode}`);

      if (cancelResponse.statusCode === 200) {
        console.log('✅ Meeting cancelled successfully');
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
  }

  console.log('\\n🏁 Calendar API test completed');
  console.log('\\n📋 Available Calendar Endpoints:');
  console.log('POST   /api/calendar/meetings              - Create meeting');
  console.log('GET    /api/calendar/meetings              - Get meetings');
  console.log('GET    /api/calendar/meetings/upcoming     - Get upcoming meetings');
  console.log('GET    /api/calendar/meetings/:id          - Get meeting details');
  console.log('PUT    /api/calendar/meetings/:id          - Update meeting');
  console.log('DELETE /api/calendar/meetings/:id          - Cancel meeting');
  console.log('POST   /api/calendar/meetings/:id/participants - Add participants');
  console.log('PUT    /api/calendar/meetings/:id/response - Update response');
  console.log('GET    /api/calendar/availability          - Get available slots');
  console.log('GET    /api/calendar/overview              - Get calendar overview');
}

testCalendarAPI();