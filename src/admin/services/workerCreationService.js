const prisma = require('../../config/database');
const bcrypt = require('bcrypt');
const { CustomError } = require('../../utils/errorHandler');

class WorkerCreationService {
  static async createWorker({
    username,
    email,
    password,
    full_name,
    phone,
    profile_image_url,
    metadata,
    createdBy
  }) {
    // Validate admin
    const admin = await prisma.users.findUnique({
      where: { id: createdBy },
      select: { last_login: true, role: true, status: true }
    });

    if (!admin || admin.status !== 'active') {
      throw new CustomError('Admin not found or inactive', 404);
    }

    if (admin.role !== 'admin') {
      throw new CustomError('Only admins can create workers', 403);
    }

    if (!admin.last_login) {
      throw new CustomError('Admin must be logged in to create workers', 401);
    }

    // Check for existing user
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new CustomError('User with this email or username already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create worker, hierarchy, and audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create worker
      const newWorker = await tx.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
          full_name,
          phone,
          role: 'worker',
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
          child_id: newWorker.id,
          created_at: new Date()
        }
      });

      // Create audit log
      await tx.auditLogs.create({
        data: {
          user_id: createdBy,
          action: 'create_worker',
          entity_type: 'user',
          entity_id: newWorker.id,
          old_values: null,
          new_values: {
            username,
            email,
            full_name,
            role: 'worker',
            created_by: createdBy
          },
          created_at: new Date()
        }
      });

      return newWorker;
    });

    return result;
  }

  static async listWorkers(createdBy) {
    const admin = await prisma.users.findUnique({
      where: { id: createdBy },
      select: { last_login: true, role: true, status: true }
    });

    if (!admin || admin.status !== 'active') {
      throw new CustomError('Admin not found or inactive', 404);
    }

    if (admin.role !== 'admin') {
      throw new CustomError('Only admins can list workers', 403);
    }

    if (!admin.last_login) {
      throw new CustomError('Admin must be logged in to list workers', 401);
    }

    const workers = await prisma.users.findMany({
      where: {
        role: 'worker',
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
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    return workers;
  }
}

module.exports = WorkerCreationService;