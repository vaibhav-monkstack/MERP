const http = require('http');
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    console.log('--- LOGIN VERIFICATION START ---');
    
    // 1. Ensure user exists
    const email = 'admin@factory.com';
    const pass = 'admin123';
    const hashed = await bcrypt.hash(pass, 10);
    
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
      ['Admin User', email, hashed, 'Job Manager']);
    
    console.log('✅ User seeded successfully');

    // 2. Test HTTP Login
    const data = JSON.stringify({ username: email, password: pass });
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('--- HTTP RESPONSE ---');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        
        if (res.statusCode === 200) {
          console.log('🎉 VERIFICATION SUCCESSFUL!');
        } else {
          console.error('❌ VERIFICATION FAILED with Status:', res.statusCode);
        }
        process.exit(res.statusCode === 200 ? 0 : 1);
      });
    });

    req.on('error', (e) => {
      console.error('❌ HTTP REQUEST ERROR:', e.message);
      process.exit(1);
    });

    req.write(data);
    req.end();

  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err);
    process.exit(1);
  }
}

test();
