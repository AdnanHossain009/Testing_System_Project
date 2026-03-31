const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const failure = (res, message = 'Something went wrong', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { success, failure };
