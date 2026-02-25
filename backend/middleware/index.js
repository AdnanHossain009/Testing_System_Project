// Export all middleware
module.exports = {
  ...require('./auth'),
  ...require('./errorHandler'),
  ...require('./validation'),
};
