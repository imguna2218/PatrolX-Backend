const ActivePatrolService = require('../services/activePatrolService');
const { CustomError } = require('../../utils/errorHandler');

class ActivePatrolController {
    static async getActivePatrols(req, res, next) {
        try {
            const adminId  = req.params.adminId || req.user.id;
            console.log('Received request to get active patrols:', { adminId });
            // if (!adminId) {
            //     throw new CustomError('Please Login!', 400);
            // }
            const activePatrols = await ActivePatrolService.getActivePatrols(adminId);
            res.status(200).json({
                status: 'success',
                data: activePatrols
            });
        } catch (error) {
            next(error);
        }
    }

    static async getWorkerLocations(req, res, next) {
        try {
            const adminId = req.params.adminId || req.user.id;
            console.log('Received request to get worker location:', { adminId });

            // if (!adminId) {
            //     throw new CustomError('Please Login!', 400);
            // }
            const workerLocations = await ActivePatrolService.getWorkerLocations(adminId);
            res.status(200).json({
                status: 'success',
                data: workerLocations
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = ActivePatrolController;