const ProfileRetrievalService = require('../services/profileRetrievalService');
const { CustomError } = require('../../utils/errorHandler');

class ProfileRetrievalController {
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id; // Extract user ID from JWT token
      console.log('Fetching worker profile for userId:', userId); // Debug log
      const profile = await ProfileRetrievalService.getWorkerProfile(userId);
      res.json({
        status: 'success',
        message: 'Worker profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileRetrievalController;