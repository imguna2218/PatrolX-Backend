const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');

class AssignmentService {
    static async checkAvailability(workerId, locationId, startTime, endTime, startDate, endDate) {
        console.log('Received request to check availability: (assignmentService.js)', {
            workerId,
            locationId,
            startTime,
            endTime,
            startDate,
            endDate
        });

        // Parse dates and convert to IST (assuming input is in UTC)
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);

        // Apply IST offset (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const startIST = new Date(startDateTime.getTime() + istOffset);
        const endIST = new Date(endDateTime.getTime() + istOffset);

        console.log('Start DateTime (IST):', startIST.toString());
        console.log('End DateTime (IST):', endIST.toString());

        // Validate date and time inputs
        if (isNaN(startIST.getTime())) {
            throw new CustomError('Invalid start time format', 400);
        }
        if (isNaN(endIST.getTime())) {
            throw new CustomError('Invalid end time format', 400);
        }
        if (startIST >= endIST) {
            throw new CustomError('End time must be after start time', 400);
        }

        // Check for overlapping assignments at the location
        const locationOverlap = await prisma.workerAvailability.findMany({
            where: {
                location_id: locationId,
                is_available: false,
                OR: [
                    {
                        start_time: { lte: endIST },
                        end_time: { gte: startIST },
                    },
                ],
            },
        });

        if (locationOverlap.length > 0) {
            throw new CustomError('Location Time Occupied', 409);
        }

        // Check for overlapping assignments for the worker
        const workerOverlap = await prisma.workerAvailability.findMany({
            where: {
                worker_id: workerId,
                is_available: false,
                OR: [
                    {
                        start_time: { lte: endIST },
                        end_time: { gte: startIST },
                    },
                ],
            },
        });

        if (workerOverlap.length > 0) {
            throw new CustomError('Worker Time Occupied', 409);
        }

        return {
            available: true,
            message: 'Worker and location are available for the specified time',
        };
    }
   
    static async assignLocation(workerId, assigned_by, locationId, startTime, endTime, startDate, endDate, checkpoints) {
        try {
            console.log('Received request to assign location: (assignmentService.js)', {
                workerId,
                locationId,
                startTime,
                endTime,
                startDate,
                endDate,
                checkpoints
            });

            // Parse dates and convert to IST (assuming input is in UTC)
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(endTime);

            // Apply IST offset (UTC+5:30)
            const istOffset = 5.5 * 60 * 60 * 1000;
            const startIST = new Date(startDateTime.getTime() + istOffset);
            const endIST = new Date(endDateTime.getTime() + istOffset);

            console.log('Start DateTime (IST):', startIST.toString());
            console.log('End DateTime (IST):', endIST.toString());

            // Validate dates
            if (startIST >= endIST) {
                throw new CustomError('End time must be after start time', 400);
            }

            // Calculate duration in minutes
            const durationMinutes = Math.round((endIST - startIST) / (1000 * 60));
            if (durationMinutes <= 0) {
                throw new CustomError('Duration must be positive', 400);
            }

            // Create worker availability
            const workerAvailability = await prisma.workerAvailability.create({
                data: {
                    worker_id: workerId,
                    location_id: locationId,
                    start_time: startIST,
                    end_time: endIST,
                    is_available: false
                }
            });

            // Create patrol assignment
            const patrolAssignment = await prisma.patrolAssignments.create({
                data: {
                    worker_id: workerId,
                    assigned_by: assigned_by,
                    shift_name: `Shift-${workerId}-${locationId}`,
                    start_date: startIST,
                    end_date: endIST,
                    expected_start_time: startIST,
                    expected_end_time: endIST,
                    estimated_duration_minutes: durationMinutes,
                    priority: 'medium',
                    status: 'pending',
                    instructions: 'Complete your Patrolling before the estimated time'
                }
            });

            // Create assignment location with checkpoints
            const assignmentLocationData = {
                assignment_id: patrolAssignment.id,
                location_id: locationId,
                is_mandatory: true,
                expected_duration_minutes: durationMinutes,
                special_instructions: checkpoints ? 'Visit all assigned checkpoints' : 'Standard patrol duties'
            };

            if (checkpoints && checkpoints.length > 0) {
                assignmentLocationData.checkpoints = {
                    connect: checkpoints.map(cp => ({ id: cp.id }))
                };
            }

            const assignmentLocation = await prisma.assignmentLocations.create({
                data: assignmentLocationData
            });

            return {
                workerAvailability,
                patrolAssignment,
                assignmentLocation,
                assignedCheckpoints: checkpoints || []
            };

        } catch (error) {
            console.error('Detailed assignment error:', error);
            throw new CustomError(error.message || 'Failed to assign location', 500);
        }
    }

    static async getAssignments(workerId) {
        try {
            // Fetch all patrol assignments for the worker, ordered by start_date descending
            const assignments = await prisma.patrolAssignments.findMany({
                where: {
                    worker_id: workerId,
                    deleted_at: null // Exclude soft-deleted assignments
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
}

module.exports = AssignmentService;