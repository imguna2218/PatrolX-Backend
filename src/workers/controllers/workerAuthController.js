const WorkerAuthService = require('../services/workerAuthService');
const { CustomError } = require('../../utils/errorHandler');

class WorkerAuthController {
  static async login(req, res, next) {
    try {
        const { email, password } = req.body;
        console.log('Worker login request received:', { email }); // Debug log
        const result = await WorkerAuthService.login(email, password);
        res.json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const userId = req.user.id;
      console.log('Worker logout request for userId:', userId); // Debug log
      const result = await WorkerAuthService.logout(userId);
      res.json({ status: 'success', message: result.message });
    } catch (error) {
      next(error);
    }
  }

  static async editProfile(req, res) {
    try {
      const userId = req.user.id;
      const formData = req.body;
      const file = req.file; // Get uploaded file if exists

      console.log('Received profile update request:', {
        userId,
        formData,
        file: file ? file.originalname : 'No file'
      });

      // Create an object with only non-empty values
      const profileData = {};
      
      if (file) {
        profileData.profile_image_url = file.path; // This will be handled by Cloudinary in service
      }
      if (formData.full_name) {
        profileData.full_name = formData.full_name;
      }
      if (formData.phone) {
        profileData.phone = formData.phone;
      }
      if (formData.email) {
        profileData.email = formData.email;
      }
      if (formData.username) {
        profileData.username = formData.username;
      }

      // Call the service function with filtered data
      const result = await WorkerAuthService.editProfile(userId, profileData);
      res.json({ status: 'success', message: 'Profile updated successfully', data: result });
    } catch (error) {
      throw new CustomError(error.message, error.statusCode || 500);
    }
  }
}

module.exports = WorkerAuthController;