const AssignmentService = require('../services/assignmentService');
const { CustomError } = require('../../utils/errorHandler');

class AssignmentController {
    static async checkAvailability(req, res, next) {
        try {
            const { workerId, locationId, startTime, endTime, startDate, endDate } = req.body;
            console.log('Received request to check availability: (assignmentController.js)', {
                workerId,
                locationId,
                startTime,
                endTime,
                startDate,
                endDate
            });
            // Validate required fields
            if (!workerId || !locationId || !startTime || !endTime || !startDate || !endDate) {
                throw new CustomError('Missing required fields: workerId, locationId, startTime, endTime, startDate, or endDate', 400);
            }

            // Call the service with all required parameters
            const result = await AssignmentService.checkAvailability(
                workerId,
                locationId,
                startTime,
                endTime,
                startDate,
                endDate
            );

            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async assignLocation(req, res, next) {
        try {
            const {workerId, locationId, startTime, endTime, startDate, endDate, checkpoints} = req.body;
            console.log('Received request to assign location: (assignmentController.js)', {
                workerId,
                locationId,
                startTime,
                endTime,
                startDate,
                endDate,
                checkpoints
            });
            const user = req.user; // Get the authenticated user from the request
            // Validate required fields
            if (!workerId || !locationId || !startTime || !endTime || !startDate || !endDate) {
                throw new CustomError('Missing required fields: workerId, locationId, startTime, endTime, startDate, or endDate', 400);
            }
            // Call the service with all required parameters
            const result = await AssignmentService.assignLocation(
                workerId,
                user.id,
                locationId,
                startTime,
                endTime,
                startDate,
                endDate,
                checkpoints
            );

            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getAssignments(req, res, next) {
        try {
            const { workerId } = req.params;
            console.log('Received request to get assignments: (assignmentController.js)', { workerId });
            // Validate required fields
            if (!workerId) {
                throw new CustomError('Missing required field: workerId', 400);
            }
            // Call the service to get assignments
            const assignments = await AssignmentService.getAssignments(workerId);
            res.json({ status: 'success', data: assignments });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AssignmentController;