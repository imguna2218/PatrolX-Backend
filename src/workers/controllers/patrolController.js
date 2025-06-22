const PatrolService = require('../services/patrolService');
const { CustomError } = require('../../utils/errorHandler');

class PatrolController {
    static async startPatrol(req, res, next) {
        try {
            const { locationId, assignmentId, workerId } = req.body;
            // const workerId = req.user.id;

            console.log('Received request to start patrol:', { locationId, assignmentId, workerId });

            if (!locationId || !assignmentId) {
                throw new CustomError('Location ID and Assignment ID are required', 400);
            }

            const patrolSession = await PatrolService.startPatrol(locationId, assignmentId, workerId);

            res.status(200).json({
                status: 'success',
                message: 'Patrol started successfully',
                data: patrolSession
            });
        } catch (error) {
            next(error);
        }
    }

    static async getActivePatrols(req, res, next) {
        try {
            const workerId = req.params.workerId || req.user.id;

            console.log('Received request to get active patrols:', { workerId });

            if (!workerId) {
                throw new CustomError('Please Login!', 400);
            }

            const activePatrols = await PatrolService.getActivePatrols(workerId);

            // console.log('Active patrols retrieved:', activePatrols);
            res.status(200).json({
                status: 'success',
                data: activePatrols
            });
        } catch (error) {
            next(error);
        }
    }

    static async cancelPatrol(req, res, next) {
        try {
            const { patrolId, workerId } = req.body;
            // const workerId = req.user.id;

            console.log('Received request to cancel patrol:', { patrolId, workerId });

            if (!patrolId) {
                throw new CustomError('Patrol ID is required', 400);
            }

            await PatrolService.cancelPatrol(patrolId, workerId);

            res.status(200).json({
                status: 'success',
                message: 'Patrol canceled successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCancelledPatrols(req, res, next) {
        try {
            const workerId = req.body.workerId || req.user.id;

            console.log('Received request to get cancelled patrols:', { workerId });

            if (!workerId) {
                throw new CustomError('Please Login!', 400);
            }

            const cancelledPatrols = await PatrolService.getCancelledPatrols(workerId);

            res.status(200).json({
                status: 'success',
                data: cancelledPatrols
            });
        } catch (error) {
            next(error);
        }
    }

    static async restartPatrol(req, res, next) {
        try {
            const {patrolId, workerId} = req.body;
            // const workerId = req.user.id;

            console.log('Received request to restart patrol:', { patrolId, workerId });

            if (!patrolId) {
                throw new CustomError('Patrol ID is required', 400);
            }

            const restartedPatrol = await PatrolService.restartPatrol(patrolId, workerId);

            res.status(200).json({
                status: 'success',
                message: 'Patrol restarted successfully',
                data: restartedPatrol
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateLocation(req, res, next) {
        try {
            const { latitude, longitude, workerId } = req.body;
            // const workerId = req.user.id;

            console.log('Received request to update location:', { latitude, longitude, workerId });

            if (!latitude || !longitude) {
                throw new CustomError('Latitude and Longitude are required', 400);
            }

            const updatedLocation = await PatrolService.updateLocation(workerId, latitude, longitude);

            res.status(200).json({
                status: 'success',
                message: 'Location updated successfully',
                data: updatedLocation
            });
        } catch (error) {
            next(error);
        }
    }

    static async markCheckpoint(req, res, next) {
        try {
            const { assignmentId, workerId, checkpointId, sessionId, assignmentLocationId, status} = req.body;
            // validate the request body
            console.log('Received request to mark checkpoint:', { assignmentId, workerId, checkpointId, sessionId, assignmentLocationId, status });
            if (!assignmentId || !workerId || !checkpointId || !sessionId || !assignmentLocationId || !status) {
                throw new CustomError('All fields are required', 400);
            }

            const checkpoint = await PatrolService.markCheckpoint({ workerId, checkpointId, assignmentId, sessionId, assignmentLocationId, status });

            res.status(200).json({
                status: 'success',
                message: `Checkpoint marked as ${status} successfully`,
                data: checkpoint,
            });

        } catch (error) {
            next(error);
        }
    }

    static async endPatrol(req, res, next) {
        try {
            const { assignmentId, workerId, sessionId, latitude, longitude } = req.body;
            // validate the request body
            console.log('Received request to end patrol:', { assignmentId, workerId, sessionId, latitude, longitude });
            if (!assignmentId || !workerId || !sessionId || !latitude || !longitude) {
                throw new CustomError('All fields are required', 400);
            }
            const patrolSession = await PatrolService.endPatrol({ assignmentId, workerId, sessionId, latitude, longitude });

            res.status(200).json({
                status: 'success',
                message: 'Patrol ended successfully',
                data: patrolSession,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PatrolController;