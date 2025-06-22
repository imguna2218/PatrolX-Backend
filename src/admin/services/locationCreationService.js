const prisma = require('../../config/database');
const { CustomError } = require('../../utils/errorHandler');

class LocationCreationService {
    async createLocation(data) {
        const { name, description, address, latitude, longitude, createdBy } = data;
        try {
            // Validate inputs
            if (!name || typeof name !== 'string' || name.length > 100) {
                throw new CustomError('Name is required and must be a string with max length 100', 400);
            }
            if (description && typeof description !== 'string') {
                throw new CustomError('Description must be a string', 400);
            }
            if (address && typeof address !== 'string') {
                throw new CustomError('Address must be a string', 400);
            }
            if (typeof latitude !== 'number' || isNaN(latitude)) {
                throw new CustomError('Latitude must be a valid number', 400);
            }
            if (typeof longitude !== 'number' || isNaN(longitude)) {
                throw new CustomError('Longitude must be a valid number', 400);
            }
            if (!createdBy || typeof createdBy !== 'string') {
                throw new CustomError('CreatedBy is required and must be a string', 400);
            }

            const location = await prisma.locations.create({
                data: {
                    name,
                    description,
                    address,
                    latitude: parseFloat(latitude.toFixed(8)), // Ensure precision for Decimal(10,8)
                    longitude: parseFloat(longitude.toFixed(8)), // Ensure precision for Decimal(11,8)
                    created_by: createdBy, // Fixed field name to match schema
                    created_at: new Date(), // Match schema field name
                    updated_at: new Date(), // Match schema field name
                    metadata: {} // Ensure default empty JSON as per schema
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    created_by: true, // Fixed field name to match schema
                    created_at: true // Fixed field name to match schema
                },
            });
            return location;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            console.error('Prisma error:', error); // Log detailed error for debugging
            throw new CustomError(`Error creating location: ${error.message}`, 500);
        }
    }

    async listLocations(createdBy) {
        try {
            if (!createdBy || typeof createdBy !== 'string') {
                throw new CustomError('CreatedBy is required and must be a string', 400);
            }

            const locations = await prisma.locations.findMany({ // Fixed table name to match schema 'Locations'
                select: {
                    id: true,
                    name: true,
                    description: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    checkpoints: true, 
                    created_by: true, // Fixed field name to match schema
                    created_at: true // Fixed field name to match schema
                },
            });
            return locations;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            console.error('Prisma error:', error); // Log detailed error for debugging
            throw new CustomError(`Error fetching locations: ${error.message}`, 500);
        }
    }

    async createCheckpoint(data) {
        try {
            const { name, location_id, latitude, longitude, sequence_order } = data;
            if (!name || typeof name !== 'string' || name.length > 100) {
                throw new CustomError('Name is required and must be a string with max length 100', 400);
            }
            if (!location_id || typeof location_id !== 'string') {
                throw new CustomError('LocationId is required and must be a string', 400);
            }
            if (typeof latitude !== 'number' || isNaN(latitude)) {
                throw new CustomError('Latitude must be a valid number', 400);
            }
            if (typeof longitude !== 'number' || isNaN(longitude)) {
                throw new CustomError('Longitude must be a valid number', 400);
            }
            if (typeof sequence_order !== 'number' || isNaN(sequence_order)) {
                throw new CustomError('SequenceOrder must be a valid number', 400);
            }

            const checkpoint = await prisma.$transaction(async (prisma) => {
            // Create the checkpoint
            const newCheckpoint = await prisma.checkpoints.create({
                data: {
                name,
                location_id,
                latitude: parseFloat(latitude.toFixed(8)), // Ensure precision for Decimal(10,8)
                longitude: parseFloat(longitude.toFixed(8)), // Ensure precision for Decimal(11,8)
                sequence_order,
                priority: 'medium', // Default to 'MEDIUM' if undefined
                radius_meters: 50, // Default to 50 if undefined
                created_at: new Date(), // Match schema field name
                },
                select: {
                id: true,
                name: true,
                location_id: true,
                latitude: true,
                longitude: true,
                radius_meters: true,
                sequence_order: true,
                priority: true,
                created_at: true,
                },
            });

            // Update the Locations table to connect the new checkpoint
            await prisma.locations.update({
                where: {
                id: location_id,
                },
                data: {
                checkpoints: {
                    connect: {
                    id: newCheckpoint.id,
                    },
                },
                },
            });

            return newCheckpoint;
        });

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            console.error('Prisma error:', error); // Log detailed error for debugging
            throw new CustomError(`Error creating location: ${error.message}`, 500);
        }
    }
}

module.exports = new LocationCreationService();