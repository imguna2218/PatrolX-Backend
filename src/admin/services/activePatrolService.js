const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');


class ActivePatrolService {
  static async getActivePatrols(adminId) {
    try {
        // First find all workers created by this admin
        const workers = await prisma.users.findMany({
            where: {
                created_by: adminId,
                role: 'worker' // Assuming 'worker' is a valid UserRole
            },
            select: {
                id: true
            }
        });

        if (!workers.length) {
            return [];
        }

        const workerIds = workers.map(worker => worker.id);

        // Find all active patrol assignments for these workers
        const assignments = await prisma.patrolAssignments.findMany({
            where: {
                worker_id: { in: workerIds },
                status: 'active', // Only active patrols
                patrol_sessions: {
                    some: {
                        status: { in: ['in_progress', 'paused'] } // Only sessions that are in progress or paused
                    }
                }
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                assignment_locations: {
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                                latitude: true,
                                longitude: true
                            }
                        },
                        checkpoints: {
                            select: {
                                id: true,
                                name: true,
                                latitude: true,
                                longitude: true
                            }
                        }
                    }
                },
                patrol_sessions: {
                    where: {
                        status: { in: ['in_progress', 'paused'] }
                    },
                    include: {
                        checkpoint_visits: {
                            include: {
                                checkpoint: {
                                    select: {
                                        id: true,
                                        name: true,
                                        latitude: true,
                                        longitude: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Format the response as specified
        const formattedAssignments = assignments.map(assignment => ({
            workerId: assignment.worker_id,
            workerName: assignment.worker.full_name,
            assignmentId: assignment.id,
            shiftName: assignment.shift_name,
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            expectedStartTime: assignment.expected_start_time,
            expectedEndTime: assignment.expected_end_time,
            estimatedDurationMinutes: assignment.estimated_duration_minutes,
            priority: assignment.priority,
            status: assignment.status,
            instructions: assignment.instructions,
            createdAt: assignment.created_at,
            sessionId: assignment.patrol_sessions[0]?.id,
            sessionDate: assignment.patrol_sessions[0]?.session_date,
            startedAt: assignment.patrol_sessions[0]?.started_at,
            progressPercentage: assignment.patrol_sessions[0]?.progress_percentage,
            completedCheckpointsCount: assignment.patrol_sessions[0]?.completed_checkpoints_count,
            checkpointVisits: assignment.patrol_sessions[0]?.checkpoint_visits.map(visit => ({
                checkpointId: visit.checkpoint.id,
                name: visit.checkpoint.name,
                latitude: visit.checkpoint.latitude,
                longitude: visit.checkpoint.longitude,
                status: visit.status,
                arrivedAt: visit.arrived_at,
                departedAt: visit.departed_at
            })) || [],
            locations: assignment.assignment_locations.map(loc => ({
                locationId: loc.location.id,
                name: loc.location.name,
                latitude: loc.location.latitude,
                longitude: loc.location.longitude,
                isMandatory: loc.is_mandatory,
                expectedDurationMinutes: loc.expected_duration_minutes,
                specialInstructions: loc.special_instructions,
                checkpoints: loc.checkpoints.map(cp => ({
                    id: cp.id,
                    name: cp.name,
                    latitude: cp.latitude,
                    longitude: cp.longitude
                }))
            }))
        }));

        return formattedAssignments;
    } catch (error) {
        console.error('Error fetching active patrols:', error);
        throw error;
    }
  }   

  static async getWorkerLocations(adminId) {
    try {
        // Find all workers created by this admin
        const workers = await prisma.users.findMany({
        where: {
            created_by: adminId,
            role: 'worker', // Assuming 'worker' is a valid UserRole
        },
        include: {
            WorkerLocation: true,
            assigned_patrols: {
            where: {
                OR: [
                { status: 'active' }, // Active patrol assignments
                {
                    patrol_sessions: {
                    some: {
                        status: 'in_progress' // Active patrol sessions
                    }
                    }
                }
                ]
            },
            include: {
                assignment_locations: {
                include: {
                    location: true
                }
                },
                patrol_sessions: {
                where: {
                    status: 'in_progress'
                }
                }
            }
            }
        }
        });

        // Filter workers who have active patrols and location data
        const result = workers
        .filter(worker => 
            worker.assigned_patrols.length > 0 && 
            worker.WorkerLocation
        )
        .map(worker => {
            const activePatrol = worker.assigned_patrols[0]; // Assuming one active patrol per worker
            const patrolLocation = activePatrol.assignment_locations[0]?.location; // Assuming one location per assignment

            return {
            workerId: worker.id,
            workerName: worker.full_name,
            workerLatitude: worker.WorkerLocation.latitude,
            workerLongitude: worker.WorkerLocation.longitude,
            lastUpdated: worker.WorkerLocation.updatedAt,
            patrolLocation: patrolLocation ? {
                id: patrolLocation.id,
                name: patrolLocation.name,
                latitude: patrolLocation.latitude,
                longitude: patrolLocation.longitude,
                address: patrolLocation.address
            } : null,
            patrolAssignment: {
                id: activePatrol.id,
                status: activePatrol.status,
                startDate: activePatrol.start_date,
                endDate: activePatrol.end_date
            }
            };
        });

        return result;
    } catch (error) {
        console.error('Error fetching worker locations:', error);
        throw new Error('Failed to fetch worker locations');
    }
  }
}

module.exports = ActivePatrolService;