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

    // 2. Verify password (handling both hashed and legacy plain-text for transition)
    let isMatch = false;
    try {
      // Check if it's a bcrypt hash
      if (user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Fallback for legacy plain-text passwords
        isMatch = (password === user.password);
        
        // OPTIONAL: Automatically hash the password now for future security
        // const hashed = await bcrypt.hash(password, 10);
        // await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    } catch (err) {
      console.error('Bcrypt comparison error:', err);
      // If bcrypt fails (e.g. malformed hash), fallback to plain comparison just in case
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
