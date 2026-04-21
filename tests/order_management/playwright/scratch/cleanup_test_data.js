const { execSync } = require('child_process');
const path = require('path');

// Surgical cleanup of test-specific data (Orders and Jobs only)
// This script allows you to keep your "Product Templates" while removing the test clutter.

const backendDir = path.join(__dirname, '../../../../src/backend');

try {
    console.log('🧹 Cleaning up test orders and jobs...');
    // We run the cleanup script from the backend scripts folder
    execSync('node scripts/cleanup_db.js', { cwd: backendDir, stdio: 'inherit' });
    console.log('✅ Cleanup successful.');
} catch (err) {
    console.error('❌ Cleanup failed:', err.message);
}
