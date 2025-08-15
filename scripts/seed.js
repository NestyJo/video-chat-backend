#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

// Path to the TypeScript seeder
const seederPath = path.join(__dirname, '..', 'src', 'seeders', 'index.ts');

// Run the seeder with ts-node
const child = spawn('npx', ['ts-node', seederPath, ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Failed to run seeder:', error);
  process.exit(1);
});