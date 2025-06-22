const SuperAdminService = require('./super-adminService');
  const { CustomError } = require('../utils/errorHandler');

  class SuperAdminController {
    static async registerSuperAdmin(req, res) {
      try {
        const {
          username,
          email,
          password,
          full_name,
          phone,
          profile_image_url,
          metadata
        } = req.body;

        const result = await SuperAdminService.registerSuperAdmin({
          username,
          email,
          password,
          full_name,
          phone,
          profile_image_url,
          metadata
        });

        res.status(201).json({
          status: 'success',
          message: 'Super admin created successfully',
          data: result
        });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    }

    static async login(req, res) {
      try {
        const { email, password } = req.body;
        console.log('Login request received:', { email, password });
        
        const result = await SuperAdminService.login(email, password);
        res.json({ status: 'success', data: result });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 400);
      }
    }

    static async logout(req, res) {
      try {
        const userId = req.user.id;
        const result = await SuperAdminService.logout(userId);
        res.json({ status: 'success', message: result.message });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    }

    static async createAdmin(req, res) {
      try {
        console.log('createAdmin called'); // Debug log
        const {
          username,
          email,
          password,
          full_name,
          phone,
          profile_image_url,
          metadata
        } = req.body;
        const createdBy = req.user.id;

        const result = await SuperAdminService.createAdmin({
          username,
          email,
          password,
          full_name,
          phone,
          profile_image_url,
          metadata,
          createdBy
        });

        res.status(201).json({
          status: 'success',
          message: 'Admin created successfully',
          data: result
        });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    }

    static async listAdmins(req, res) {
      try {
        const createdBy = req.user.id;
        const admins = await SuperAdminService.listAdmins(createdBy);
        res.json({ status: 'success', data: admins });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    }

    static async getProfile(req, res, next) {
      try {
        const userId = req.user.id; // Extract user ID from JWT token
        console.log('Fetching super-admin profile for userId:', userId); // Debug log
        const profile = await SuperAdminService.getSuperAdminProfile(userId);
        res.json({
          status: 'success',
          message: 'Super-admin profile retrieved successfully',
          data: profile
        });
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
        const result = await SuperAdminService.editProfile(userId, profileData);
        res.json({ status: 'success', message: 'Profile updated successfully', data: result });
      } catch (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    }
}

  module.exports = SuperAdminController;