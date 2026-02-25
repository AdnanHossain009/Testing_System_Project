const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
