const Notification = require('../models/Notification');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const buildNotificationSummary = async (userId) => {
  const unreadCount = await Notification.countDocuments({ user: userId, read: false });
  return { unreadCount };
};

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const summary = await buildNotificationSummary(req.user._id);
  return success(res, { notifications, ...summary }, 'Notifications fetched.');
});

const getNotificationSummary = asyncHandler(async (req, res) => {
  return success(res, await buildNotificationSummary(req.user._id), 'Notification summary fetched.');
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

  const summary = await buildNotificationSummary(req.user._id);
  return success(res, { notification, ...summary }, 'Notification marked as read.');
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  return success(res, await buildNotificationSummary(req.user._id), 'All notifications marked as read.');
});

module.exports = { listMyNotifications, getNotificationSummary, markRead, markAllRead };
