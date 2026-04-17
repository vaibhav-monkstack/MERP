// Import JSON Web Token library for creating authentication tokens
const jwt = require('jsonwebtoken');
// Import bcryptjs for password hashing and verification
const bcrypt = require('bcryptjs');
// Import the database connection pool for running queries
const pool = require('../config/db');

// LOGIN HANDLER — Authenticates a user and returns a JWT token
// Called when POST /api/auth/login is hit
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Fetch user from database
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // == LOCKOUT CHECK ==
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remaining = Math.ceil((new Date(user.lockoutUntil) - new Date()) / 1000 / 60);
      return res.status(403).json({ 
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${remaining} minute(s).` 
      });
    }

    // 2. Verify password (handling both hashed and legacy plain-text for transition)
    let isMatch = false;
    try {
      // Check if it's a bcrypt hash
      if (user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Fallback for legacy plain-text passwords
        isMatch = (password === user.password);
      }
    } catch (err) {
      console.error('Bcrypt comparison error:', err);
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      // == INCREMENT FAILED ATTEMPTS (fails silently if columns don't exist yet) ==
      try {
        const newAttempts = (user.failedAttempts || 0) + 1;
        let lockoutUntil = null;
        if (newAttempts >= 3) {
          lockoutUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
        }
        await pool.query(
          'UPDATE users SET failedAttempts = ?, lockoutUntil = ? WHERE id = ?',
          [newAttempts, lockoutUntil, user.id]
        );
      } catch (lockErr) {
        console.warn('Lockout tracking skipped (columns may not exist yet):', lockErr.message);
      }

      return res.status(401).json({ 
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 3 - ((user.failedAttempts || 0) + 1))
      });
    }

    // == SUCCESS: RESET LOCKOUT (fails silently if columns don't exist yet) ==
    try {
      await pool.query(
        'UPDATE users SET failedAttempts = 0, lockoutUntil = NULL WHERE id = ?',
        [user.id]
      );
    } catch (resetErr) {
      console.warn('Lockout reset skipped (columns may not exist yet):', resetErr.message);
    }


    // 3. Generate JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '8h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      role: user.role,
      userId: user.id,
      userName: user.name
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};
