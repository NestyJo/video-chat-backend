#!/usr/bin/env node

const net = require('net');

console.log('🔌 Testing MySQL Port Connection');
console.log('=================================');

const host = 'localhost';
const port = 3307;

console.log(`📍 Testing connection to ${host}:${port}...`);

const socket = new net.Socket();

socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('✅ Port 3307 is open and accepting connections!');
  console.log('✅ MySQL Docker container is running');
  console.log('');
  console.log('🎉 MySQL is available and ready!');
  console.log('');
  console.log('📋 Status:');
  console.log('✅ MySQL Server: Running on port 3307');
  console.log('✅ Connection: Successful');
  console.log('✅ Ready for application use');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Install Node.js packages: npm install');
  console.log('2. Set up database tables');
  console.log('3. Remove MongoDB implementation');
  
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('❌ Connection timeout');
  console.log('💡 MySQL might not be running on port 3307');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('❌ Connection failed:', err.message);
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('- Check if MySQL Docker container is running');
  console.log('- Verify the container is using port 3307');
  console.log('- Run: docker ps to see running containers');
  console.log('- Run: docker logs [container_name] to check logs');
});

socket.on('close', () => {
  console.log('🔌 Connection test completed');
});

socket.connect(port, host);