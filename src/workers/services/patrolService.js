const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');

class PatrolService {
    static async startPatrol(locationId, assignmentId, workerId) {
        try {
            console.log('Starting patrol with parameters:', { locationId, assignmentId, workerId });
            // Check if worker has any active patrols
            const activePatrol = await prisma.patrolAssignments.findFirst({
                where: {
                    worker_id: workerId,
                    status: 'active',
                    id: {
                        not: assignmentId
                    }
                }
            });

            if (activePatrol) {
                throw new CustomError('You already have an active patrol. Please cancel it or complete it before starting a new one.', 400);
            }


            // Update assignment status to active
            const updatedAssignment = await prisma.patrolAssignments.update({
                where: {
                    id: assignmentId
                },
                data: {
                    status: 'active',
                    updated_at: new Date()
                }
            });

            // Create a new patrol session
            const patrolSession = await prisma.patrolSessions.create({
                data: {
                    assignment_id: assignmentId,                  
                    worker_id: workerId,
                    session_date: new Date(),
                    started_at: new Date(),
                    progress_percentage: 0,
                    status: 'in_progress'
                }
            });


            return updatedAssignment;
        } catch (error) {
            throw error;
        }
    }

    static async getActivePatrols(workerId) {
        try {
            // Fetch all patrol assignments for the worker, ordered by start_date descending
            const assignments = await prisma.patrolAssignments.findMany({
                where: {
                    worker_id: workerId,
                    deleted_at: null, // Exclude soft-deleted assignments
                    status: 'active' // Only fetch active assignments
                },
                orderBy: {
                    start_date: 'desc' // Newest dates first
                },
                select: {
                    id: true,
                    shift_name: true,
                    start_date: true,
                    end_date: true,
                    expected_start_time: true,
                    expected_end_time: true,
                    estimated_duration_minutes: true,
                    priority: true,
                    status: true,
                    instructions: true,
                    created_at: true,
                    assignment_locations: {
                        select: {
                            id: true,
                            location_id: true,
                            is_mandatory: true,
                            expected_duration_minutes: true,
                            special_instructions: true,
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
                        select: {
                            id: true,
                            session_date: true,
                            started_at: true,
                            progress_percentage: true,
                            completed_checkpoints_count: true,
                            checkpoint_visits: {
                                select: {
                                    checkpoint: {
                                        select: {
                                            id: true,
                                            name: true,
                                            latitude: true,
                                            longitude: true,
                                        }
                                    }, 
                                    status: true,
                                }
                            }
                        }
                    }
                }
            });

            // Transform the data to the desired format
            const formattedAssignments = assignments.map(assignment => ({
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
                    status: visit.status
                })) || [],
                locations: assignment.assignment_locations.map(loc => ({
                    assignmentLocationId: loc.id,
                    locationId: loc.location_id,
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
            throw new CustomError(error.message || 'Failed to fetch assignments', 500);
        }
    }

    static async cancelPatrol(patrolId, workerId) {
        try {
            // Check if the patrol session exists and belongs to the worker
            const patrolSession = await prisma.patrolSessions.findFirst({
                where: {
                    id: patrolId,
                    worker_id: workerId,
                    status: 'in_progress'
                }
            });

            if (!patrolSession) {
                throw new CustomError('Patrol session not found or does not belong to you', 404);
            }

            // Update the patrol session status to 'cancelled'
            await prisma.patrolSessions.update({
                where: { id: patrolId },
                data: { status: 'abandoned', updated_at: new Date() }
            });

            // Update the assignment status to 'cancelled'
            await prisma.patrolAssignments.update({
                where: { id: patrolSession.assignment_id },
                data: { status: 'cancelled', updated_at: new Date() }
            });

            return { message: 'Patrol cancelled successfully' };
        } catch (error) {
            throw error;
        }
    }

    static async getCancelledPatrols(workerId) {
        try {
            // Fetch all patrol assignments for the worker, ordered by start_date descending
            const assignments = await prisma.patrolAssignments.findMany({
                where: {
                    worker_id: workerId,
                    deleted_at: null, // Exclude soft-deleted assignments
                    status: 'cancelled' // Only fetch cancelled assignments
                },
                orderBy: {
                    start_date: 'desc' // Newest dates first
                },
                select: {
                    id: true,
                    shift_name: true,
                    start_date: true,
                    end_date: true,
                    expected_start_time: true,
                    expected_end_time: true,
                    estimated_duration_minutes: true,
                    priority: true,
                    status: true,
                    instructions: true,
                    created_at: true,
                    assignment_locations: {
                        select: {
                            id: true,
                            location_id: true,
                            is_mandatory: true,
                            expected_duration_minutes: true,
                            special_instructions: true,
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
                        select: {
                            id: true,
                            session_date: true,
                            started_at: true,
                            progress_percentage: true,
                            completed_checkpoints_count: true,
                            checkpoint_visits: {
                                select: {
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

            // Transform the data to the desired format
            const formattedAssignments = assignments.map(assignment => ({
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
                    longitude: visit.checkpoint.longitude
                })) || [],
                locations: assignment.assignment_locations.map(loc => ({
                    locationId: loc.location_id,
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
            throw new CustomError(error.message || 'Failed to fetch assignments', 500);
        }
    }

    static async restartPatrol(patrolId, workerId) {
        try {
            // Check if the patrol session exists and belongs to the worker
            const patrolSession = await prisma.patrolSessions.findFirst({
                where: {
                    id: patrolId,
                    worker_id: workerId,
                    status: 'abandoned'
                }
            });

            if (!patrolSession) {
                throw new CustomError('Patrol session not found, does not belong to you, or is not abandoned', 404);
            }

            // Check if worker has any active patrols
            const activePatrol = await prisma.patrolAssignments.findFirst({
                where: {
                    worker_id: workerId,
                    status: 'active',
                    id: {
                        not: patrolSession.assignment_id
                    }
                }
            });

            if (activePatrol) {
                throw new CustomError('You already have an active patrol. Please cancel it or complete it before restarting this one.', 400);
            }

            // Update the patrol session to reset progress and set status to in_progress
            const updatedPatrolSession = await prisma.patrolSessions.update({
                where: { id: patrolId },
                data: {
                    status: 'in_progress',
                    progress_percentage: 0,
                    started_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Update the assignment status to active
            const updatedAssignment = await prisma.patrolAssignments.update({
                where: { id: patrolSession.assignment_id },
                data: {
                    status: 'active',
                    updated_at: new Date()
                }
            });

            return {
                message: 'Patrol restarted successfully',
                patrolSession: updatedPatrolSession,
                assignment: updatedAssignment
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateLocation(workerId, latitude, longitude) {
        try {
            // Check if a WorkerLocation record exists for the workerId
            const existingLocation = await prisma.workerLocation.findUnique({
                where: { userId: workerId }
            });

            if (existingLocation) {
                // Update existing record
                const updatedLocation = await prisma.workerLocation.update({
                    where: { userId: workerId },
                    data: {
                        latitude,
                        longitude,
                        updatedAt: new Date() // Automatically updated by @updatedAt, but included for clarity
                    }
                });
                return updatedLocation;
            } else {
                // Create new record
                const newLocation = await prisma.workerLocation.create({
                    data: {
                        userId: workerId,
                        latitude,
                        longitude
                    }, 
                    select: {
                        id: true,
                        userId: true,
                        latitude: true,
                        longitude: true,
                        updatedAt: true
                    }
                });
                return newLocation;
            }
        } catch (error) {
            throw error;
        }
    }

    static async markCheckpoint({ workerId, checkpointId, assignmentId, sessionId, assignmentLocationId, status }) {
    // Input validation
    

    try {
      if (status === 'arrived') {
        // Create new checkpoint visit record for arrival
        return await prisma.checkpointVisits.create({
          data: {
            session_id: sessionId,
            assignment_location_id: assignmentLocationId,
            checkpoint_id: checkpointId,
            arrived_at: new Date(),
            status: 'arrived',
            geofence_status: 'inside',
          },
        });
      } else {
        // Fetch existing visit for the session, location, and checkpoint
        const existingVisit = await prisma.checkpointVisits.findFirst({
          where: {
            session_id: sessionId,
            assignment_location_id: assignmentLocationId,
            checkpoint_id: checkpointId,
            status: 'arrived', // Ensure the visit is still in 'arrived' state
          },
        });

        if (!existingVisit) {
          throw new Error('No active visit found for this session, location, and checkpoint');
        }

        const now = new Date();
        const durationMinutes = Math.floor(
          (now.getTime() - existingVisit.arrived_at.getTime()) / (1000 * 60)
        );

        // Update the visit record to mark as completed
        return await prisma.checkpointVisits.update({
          where: {
            id: existingVisit.id, // Use unique ID for precise update
          },
          data: {
            departed_at: now,
            status: 'completed',
            geofence_status: 'outside',
            duration_minutes: durationMinutes,
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to mark checkpoint: ${error.message}`);
    }
    }

    static async endPatrol({ assignmentId, workerId, sessionId, latitude, longitude }) {
        try {
            // Start a transaction to ensure atomicity
            return await prisma.$transaction(async (tx) => {
                // Verify the patrol session exists and is active
                const session = await tx.patrolSessions.findFirst({
                    where: {
                        id: sessionId,
                        assignment_id: assignmentId,
                        worker_id: workerId,
                        status: 'in_progress'
                    }
                });

                if (!session) {
                    throw new CustomError('No active patrol session found', 404);
                }

                // Calculate total duration if started_at exists
                const totalDurationMinutes = session.started_at 
                    ? Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000 / 60)
                    : null;

                // Update PatrolSession to completed
                const updatedSession = await tx.patrolSessions.update({
                    where: { id: sessionId },
                    data: {
                        status: 'completed',
                        ended_at: new Date(),
                        end_latitude: latitude ? parseFloat(latitude) : null,
                        end_longitude: longitude ? parseFloat(longitude) : null,
                        total_duration_minutes: totalDurationMinutes,
                        updated_at: new Date()
                    }
                });

                // Update PatrolAssignment to completed
                await tx.patrolAssignments.update({
                    where: { id: assignmentId },
                    data: {
                        status: 'completed',
                        end_date: new Date(),
                        updated_at: new Date()
                    }
                });

                return updatedSession;
            });
        } catch (error) {
            throw new CustomError(error.message || 'Failed to end patrol', 500);
        }
    }
}

module.exports = PatrolService;