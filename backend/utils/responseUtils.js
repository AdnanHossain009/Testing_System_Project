/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Error details
 */
const sendError = (res, statusCode = 500, message = 'Error', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create pagination metadata
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @returns {Object} Pagination object
 */
const getPagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Parse pagination query parameters
 * @param {Object} query - Express query object
 * @returns {Object} Parsed pagination parameters
 */
const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format single resource response
 * @param {Object} resource - Resource object
 * @param {String} message - Success message
 * @returns {Object} Formatted response
 */
const formatResourceResponse = (resource, message = 'Resource fetched successfully') => {
  return {
    success: true,
    message,
    data: resource,
  };
};

/**
 * Format list response with pagination
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {String} message - Success message
 * @returns {Object} Formatted response
 */
const formatListResponse = (items, pagination, message = 'Resources fetched successfully') => {
  return {
    success: true,
    message,
    data: items,
    pagination,
  };
};

module.exports = {
  sendSuccess,
  sendError,
  getPagination,
  parsePaginationParams,
  formatResourceResponse,
  formatListResponse,
};
