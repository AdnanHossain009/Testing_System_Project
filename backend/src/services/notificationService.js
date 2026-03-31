const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, type = 'info' }) => {
  if (!user) return null;
  return Notification.create({ user, title, message, type });
};

module.exports = { createNotification };
