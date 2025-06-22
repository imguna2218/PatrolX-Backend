const { body, query, param, validationResult } = require('express-validator');
const { CustomError } = require('../utils/errorHandler');

const validateAvailability = [
  body('worker_id').isUUID().withMessage('Invalid worker ID'),
  body('start_time').isISO8601().toDate().withMessage('Invalid start time'),
  body('end_time').isISO8601().toDate().withMessage('Invalid end time'),
  body('is_available').isBoolean().withMessage('is_available must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  },
];

const validateMediaUpload = [
  body('session_id').isUUID().withMessage('Invalid session ID'),
  body('checkpoint_visit_id').optional().isUUID().withMessage('Invalid checkpoint visit ID'),
  body('media_type').isIn(['photo', 'video', 'audio', 'document']).withMessage('Invalid media type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  },
];

const validateNotification = [
  body('user_id').isUUID().withMessage('Invalid user ID'),
  body('notification_type').isIn(['assignment', 'alert', 'reminder', 'system']).withMessage('Invalid notification type'),
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('message').isString().notEmpty().withMessage('Message is required'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  },
];

const validateAuditLog = [
  body('user_id').isUUID().withMessage('Invalid user ID'),
  body('action').isString().notEmpty().withMessage('Action is required'),
  body('entity_type').isString().notEmpty().withMessage('Entity type is required'),
  body('entity_id').isString().notEmpty().withMessage('Entity ID is required'),
  body('details').optional().isObject().withMessage('Details must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  },
];

const validateSettings = [
  body('user_id').isUUID().withMessage('Invalid user ID'),
  body('settings_key').isString().notEmpty().withMessage('Settings key is required'),
  body('settings_value').isObject().withMessage('Settings value must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  },
];

const validateSuperAdmin = [
  body('username').isString().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').isString().notEmpty().withMessage('Full name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('profile_image_url').optional().isURL().withMessage('Invalid URL format'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  }
];

const validateSuperAdminLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  }
];

const validateCreateAdmin = [
  body('username').isString().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').isString().notEmpty().withMessage('Full name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('profile_image_url').optional().isURL().withMessage('Invalid URL format'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  }
];

const validateWorkerLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array().map(err => err.msg).join(', '), 400);
    }
    next();
  }
];

module.exports = {
  validateAvailability,
  validateMediaUpload,
  validateNotification,
  validateAuditLog,
  validateSettings,
  validateSuperAdmin,
  validateSuperAdminLogin,
  validateCreateAdmin,
  validateWorkerLogin // Added export
};