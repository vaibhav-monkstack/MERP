// Import JSON Web Token library for verifying authentication tokens
const jwt = require('jsonwebtoken');

/**
 * authMiddleware
 * Protects routes by requiring a valid JWT token in the Authorization header.
 * Verified against the JWT_SECRET from environment variables.
 */
module.exports = (req, res, next) => {
  // 1. Get token from header (Format: Bearer <token>)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // 3. Attach user data to request object for use in downstream controllers
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
};
