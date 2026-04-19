const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:5001/api/health';
const FRONTEND_URL = 'http://localhost:5173';

/**
 * Helper: Check if a URL is reachable
 */
function checkServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    }).on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Main Orchestrator
 */
async function main() {
  console.log('🚀 UI Automation Orchestrator Starting...');

  const isBackendUp = await checkServer(BACKEND_URL);
  if (!isBackendUp) {
    console.log('⚠️ Backend not reachable. Please ensure the backend is running on port 5001.');
  } else {
    console.log('✅ Backend is already running.');
  }

  const isFrontendUp = await checkServer(FRONTEND_URL);
  if (!isFrontendUp) {
    console.log('⚠️ Frontend not reachable. Please ensure the frontend is running on port 5173.');
  } else {
    console.log('✅ Frontend is already running.');
  }

  console.log('🧹 Purging old test data for a clean start...');
  try {
    execSync('node total_wipe_jobs.js', { 
      cwd: path.resolve(__dirname, '../../backend'), 
      stdio: 'inherit',
      shell: true 
    });
  } catch (e) {
    console.warn('⚠️ Pre-test cleanup failed, but continuing...');
  }

  console.log('🎭 Running Playwright UI Tests...');
  try {
    execSync('npx playwright test', { 
      cwd: __dirname, 
      stdio: 'inherit', 
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
  }
}

main();
