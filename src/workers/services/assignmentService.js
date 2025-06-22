const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');


class AssignmentService {
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