const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { CustomError } = require('../utils/errorHandler');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true, last_login: true }
    });

    if (!user || user.status !== 'active') {
      throw new CustomError('User not found or inactive', 401);
    }

    if (!user.last_login) {
      throw new CustomError('User is not logged in', 401);
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(new CustomError(error.message || 'Invalid or expired token', error.statusCode || 401));
  }
};

module.exports = { authenticate };