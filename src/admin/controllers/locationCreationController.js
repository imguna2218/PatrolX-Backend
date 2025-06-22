const { CustomError } = require('../../utils/errorHandler');
const LocationCreationService = require('../services/locationCreationService');

class LocationCreationController {
    static async createLocation(req, res, next) {
        try {
        const { name, description, address, latitude, longitude } = req.body;
        console.log('Request body:', req.body);

        const createdBy = req.user.id;
    
        const result = await LocationCreationService.createLocation({
            name,
            description,
            address,
            latitude,
            longitude,
            createdBy
        });
    
        res.status(201).json({
            status: 'success',
            message: 'Location created successfully',
            data: result
        });
        } catch (error) {
            next(error);
        }
    }

    static async listLocations(req, res, next) {
        try {
        const createdBy = req.user.id;
        const locations = await LocationCreationService.listLocations(createdBy);
        res.json({
            status: 'success',
            data: locations
        });
        } catch (error) {
            next(error);
        }
    }

    static async createCheckpoint(req, res, next) {
        try {
            const { name, location_id, latitude, longitude, sequence_order } = req.body;
            // enum Priority { medium };

            const result = await LocationCreationService.createCheckpoint({
                name,
                location_id,
                latitude,
                longitude,
                sequence_order,
            });
            res.status(201).json({
                status: 'success',
                message: 'Location created successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = LocationCreationController;