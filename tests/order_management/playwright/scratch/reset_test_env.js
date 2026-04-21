const { execSync } = require('child_process');
const path = require('path');

// This is a master utility to reset the environment for testing
const scripts = [
  'seed_locks.js',
  'seed_inventory.js'
];

const backendDir = path.join(__dirname, '../../../../src/backend');

console.log('🔄 Resetting Integration Test Environment...');

scripts.forEach(script => {
  try {
    console.log(`▶️ Running ${script}...`);
    execSync(`node scripts/${script}`, { cwd: backendDir, stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to run ${script}:`, err.message);
  }
});

console.log('✅ Environment Reset Complete.');
