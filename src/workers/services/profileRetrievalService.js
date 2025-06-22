const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');

class ProfileRetrievalService {
    static async getWorkerProfile(userId) {
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
            },
            assigned_patrols: {
              select: {
                id: true,
                shift_name: true,
                start_date: true,
                end_date: true,
                expected_start_time: true,
                expected_end_time: true,
                status: true,
                created_at: true
              },
              orderBy: { start_date: 'desc' },
              take: 5 // Limit to recent 5 assignments
            }
          }
        });

        console.log('User retrieved:', user); // Debug log
        if (!user) {
          throw new CustomError('User not found', 404);
        }

        if (user.role !== 'worker') {
          throw new CustomError('User is not a worker', 403);
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
          recent_availability: user.worker_availability,
          recent_patrol_assignments: user.assigned_patrols
        };
      } catch (error) {
        console.error('Error in getWorkerProfile:', error); // Debug log
        throw error;
      }
    }
  }

module.exports = ProfileRetrievalService;
