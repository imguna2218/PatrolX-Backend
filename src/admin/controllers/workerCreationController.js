const WorkerCreationService = require('../services/workerCreationService');
const { CustomError } = require('../../utils/errorHandler');

class WorkerCreationController {
  static async createWorker(req, res) {
    try {
      const {
        username,
        email,
        password,
        full_name,
        phone,
        profile_image_url,
        metadata
      } = req.body;
      const createdBy = req.user.id;

      const result = await WorkerCreationService.createWorker({
        username,
        email,
        password,
        full_name,
        phone,
        profile_image_url,
        metadata,
        createdBy
      });

      res.status(201).json({
        status: 'success',
        message: 'Worker created successfully',
        data: result
      });
    } catch (error) {
      throw new CustomError(error.message, error.statusCode || 500);
    }
  }

  static async listWorkers(req, res) {
    try {
      const createdBy = req.user.id;
      const workers = await WorkerCreationService.listWorkers(createdBy);
      res.json({
        status: 'success',
        data: workers
      });
    } catch (error) {
      throw new CustomError(error.message, error.statusCode || 500);
    }
  }
}

module.exports = WorkerCreationController;