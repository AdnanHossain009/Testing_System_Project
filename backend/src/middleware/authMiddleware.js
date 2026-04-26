const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasRole } = require('../utils/roleHelpers');
const getApprovalStatus = (user) => user?.approvalStatus || 'approved';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found for this token.' });
    }

    if (getApprovalStatus(user) !== 'approved') {
      return res.status(403).json({
        success: false,
        message:
          getApprovalStatus(user) === 'pending'
            ? 'Your account is still waiting for approval.'
            : 'Your account request was rejected.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!hasRole(req.user, roles)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
