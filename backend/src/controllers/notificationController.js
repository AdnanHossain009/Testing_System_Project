const Notification = require('../models/Notification');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  return success(res, { notifications }, 'Notifications fetched.');
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found.');
  }

  notification.read = true;
  await notification.save();

  return success(res, { notification }, 'Notification marked as read.');
});

module.exports = { listMyNotifications, markRead };
