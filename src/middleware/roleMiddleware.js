const { CustomError } = require('../utils/errorHandler');

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new CustomError('You do not have permission to perform this action', 403);
    }
    next();
  };
};

module.exports = { restrictTo };