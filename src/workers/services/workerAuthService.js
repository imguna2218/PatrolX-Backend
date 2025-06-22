const prisma = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config');
const { CustomError } = require('../../utils/errorHandler');

class WorkerAuthService {
  static async login(email, password) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, password_hash: true, role: true, status: true }
    });

    if (!user || user.status !== 'active') {
      throw new CustomError('Invalid credentials or inactive user', 401);
    }

    if (user.role !== 'worker') {
      throw new CustomError('User is not a worker', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new CustomError('Invalid credentials', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: '24h'
    });

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date(), isLoggedIn: true }
    });

    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  static async logout(userId) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { last_login: true, role: true, status: true }
    });

    if (!user || user.status !== 'active') {
      throw new CustomError('User not found or inactive', 404);
    }

    if (user.role !== 'worker') {
      throw new CustomError('User is not a worker', 403);
    }

    if (!user.last_login) {
      throw new CustomError('User is already logged out', 400);
    }

    await prisma.users.update({
      where: { id: userId },
      data: { last_login: null, isLoggedIn: false }
    });

    return { message: 'Logged out successfully' };
  }

  static async editProfile(userId, profileData) {
      try {
        console.log('Processing profile update:', {
          userId,
          ...profileData
        });

        let updatedData = { ...profileData };

        // Handle profile image upload to Cloudinary if provided
        if (updatedData.profile_image_url) {
          const cloudinary = require('cloudinary').v2;
          
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });

          // Upload image to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(updatedData.profile_image_url, {
            folder: 'profile_images',
            use_filename: true,
            unique_filename: false
          });

          updatedData.profile_image_url = uploadResult.secure_url;
        }

        // Update user profile
        const updatedUser = await prisma.users.update({
          where: { id: userId },
          data: updatedData,
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
            phone: true,
            role: true,
            status: true,
            profile_image_url: true,
            created_at: true,
            updated_at: true
          }
        });

        if (!updatedUser) {
          throw new CustomError('User not found', 404);
        }

        return updatedUser;
      } catch (error) {
        console.error('Profile update error:', error);
        throw new CustomError(error.message || 'Failed to update profile', error.statusCode || 500);
      }
  }
}

module.exports = WorkerAuthService;