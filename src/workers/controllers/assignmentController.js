const AssignmentService = require('../services/assignmentService');
const { CustomError } = require('../../utils/errorHandler');

class AssignmentController {
    static async getAssignments(req, res, next) {
        try {
            const workerId = req.user.id;
            if (!workerId) {
                throw new CustomError('Please Login !', 400);
            }

            console.log('Received request to get assignments: (assignmentController.js)', { workerId });
            // Validate required fields
            
            // Call the service to get assignments
            const assignments = await AssignmentService.getAssignments(workerId);
            res.json({ status: 'success', data: assignments });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AssignmentController;