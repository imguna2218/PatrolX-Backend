const ProfileRetrievalService = require('../services/profileRetrievalService');
  const { CustomError } = require('../../utils/errorHandler');

  class ProfileRetrievalController {
    static async getProfile(req, res, next) {
      try {
        const userId = req.user.id; // Extract user ID from JWT token via authMiddleware
        const profile = await ProfileRetrievalService.getAdminProfile(userId);
        res.json({
          status: 'success',
          message: 'Admin profile retrieved successfully',
          data: profile
        });
      } catch (error) {
        next(error);
      }
    }
  }

  module.exports = ProfileRetrievalController;