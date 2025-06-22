const prisma = require('../config/database');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const { jwtSecret } = require('../config');
  const { CustomError } = require('../utils/errorHandler');

  class SuperAdminService {
    static async registerSuperAdmin({
      username,
      email,
      password,
      full_name,
      phone,
      profile_image_url,
      metadata
    }) {
      const existingUser = await prisma.users.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existingUser) {
        throw new CustomError('User with this email or username already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
          full_name,
          phone,
          role: 'super_admin',
          status: 'active',
          profile_image_url,
          metadata: metadata || {},
          created_at: new Date(),
          updated_at: new Date()
        },
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          role: true,
          status: true
        }
      });

      return newUser;
    }

    static async login(email, password) {
      const user = await prisma.users.findUnique({
        where: { email },
        select: { id: true, email: true, password_hash: true, role: true, status: true }
      });

      if (!user || user.status !== 'active') {
        throw new CustomError('Invalid credentials or inactive user', 401);
      }

      if (user.role !== 'super_admin') {
        throw new CustomError('User is not a super admin', 403);
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

      if (user.role !== 'super_admin') {
        throw new CustomError('User is not a super admin', 403);
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

    static async createAdmin({
      username,
      email,
      password,
      full_name,
      phone,
      profile_image_url,
      metadata,
      createdBy
    }) {
      const superAdmin = await prisma.users.findUnique({
        where: { id: createdBy },
        select: { last_login: true, role: true, status: true }
      });

      if (!superAdmin || superAdmin.status !== 'active') {
        throw new CustomError('Super admin not found or inactive', 404);
      }

      if (superAdmin.role !== 'super_admin') {
        throw new CustomError('Only super admins can create admins', 403);
      }

      if (!superAdmin.last_login) {
        throw new CustomError('Super admin must be logged in to create admins', 401);
      }

      const existingUser = await prisma.users.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existingUser) {
        throw new CustomError('User with this email or username already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await prisma.$transaction(async (tx) => {
        // Create admin
        const newAdmin = await tx.users.create({
          data: {
            username,
            email,
            password_hash: hashedPassword,
            full_name,
            phone,
            role: 'admin',
            status: 'active',
            profile_image_url,
            metadata: metadata || {},
            created_by: createdBy,
            created_at: new Date(),
            updated_at: new Date()
          },
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
            role: true,
            status: true,
            created_by: true
          }
        });

        // Create hierarchy record
        await tx.userHierarchy.create({
          data: {
            parent_id: createdBy,
            child_id: newAdmin.id,
            created_at: new Date()
          }
        });

        // Create audit log
        await tx.auditLogs.create({
          data: {
            user_id: createdBy,
            action: 'create_admin',
            entity_type: 'user',
            entity_id: newAdmin.id,
            old_values: null,
            new_values: {
              username,
              email,
              full_name,
              role: 'admin',
              created_by: createdBy
            },
            created_at: new Date()
          }
        });

        return newAdmin;
      });

      return result;
    }

    static async listAdmins(createdBy) {
      const superAdmin = await prisma.users.findUnique({
        where: { id: createdBy },
        select: { last_login: true, role: true, status: true }
      });

      if (!superAdmin || superAdmin.status !== 'active') {
        throw new CustomError('Super admin not found or inactive', 404);
      }

      if (superAdmin.role !== 'super_admin') {
        throw new CustomError('Only super admins can list admins', 403);
      }

      if (!superAdmin.last_login) {
        throw new CustomError('Super admin must be logged in to list admins', 401);
      }

      const admins = await prisma.users.findMany({
        where: {
          role: 'admin',
          status: 'active',
          created_by: createdBy
        },
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          phone: true,
          profile_image_url: true,
          metadata: true,
          created_at: true,
          updated_at: true
        }
      });

      return admins;
    }

    static async getSuperAdminProfile(userId) {
      console.log('Fetching profile for userId:', userId); // Debug log
      try {
        const user = await prisma.users.findUnique({
          where: { id: userId },
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
            updated_at: true,
            last_login: true,
            metadata: true,
            created_by: true,
            creator: {
              select: {
                id: true,
                username: true,
                full_name: true
              }
            },
            app_settings: {
              select: {
                id: true,
                key: true,
                value: true,
                description: true,
                category: true
              }
            },
            audit_logs: {
              select: {
                id: true,
                action: true,
                entity_type: true,
                entity_id: true,
                old_values: true,
                new_values: true,
                created_at: true
              },
              orderBy: { created_at: 'desc' },
              take: 10
            },
            worker_availability: {
              select: {
                id: true,
                start_time: true,
                end_time: true,
                is_available: true
              },
              orderBy: { start_time: 'desc' },
              take: 5
            }
          }
        });

        console.log('User retrieved:', user); // Debug log
        if (!user) {
          throw new CustomError('User not found', 404);
        }

        if (user.role !== 'super_admin') {
          throw new CustomError('User is not a super admin', 403);
        }

        if (user.status !== 'active') {
          throw new CustomError('User is not active', 403);
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profile_image_url: user.profile_image_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          metadata: user.metadata,
          created_by: {
            id: user.creator?.id || null,
            username: user.creator?.username || null,
            full_name: user.creator?.full_name || null
          },
          app_settings: user.app_settings,
          recent_audit_logs: user.audit_logs,
          recent_availability: user.worker_availability
        };
      } catch (error) {
        console.error('Error in getSuperAdminProfile:', error); // Debug log
        throw error;
      }
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

  module.exports = SuperAdminService;