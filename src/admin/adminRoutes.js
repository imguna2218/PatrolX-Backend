const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateSuperAdminLogin, validateCreateAdmin } = require('../middleware/validationMiddleware');
const AdminAuthController = require('./controllers/adminAuthController');
const WorkerCreationController = require('./controllers/workerCreationController');
const LocationCreationController = require('./controllers/locationCreationController');
const AssignmentController = require('./controllers/assignmentController');
const ProfileRetrievalController = require('./controllers/profileRetrievalController');
const ActivePatrolController = require('./controllers/activePatrolController');
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/login', validateSuperAdminLogin, AdminAuthController.login);
router.post('/logout', authenticate, restrictTo('admin'), AdminAuthController.logout);

router.post('/create-worker', authenticate, restrictTo('admin'), validateCreateAdmin, WorkerCreationController.createWorker);
router.get('/list-workers', authenticate, restrictTo('admin'), WorkerCreationController.listWorkers);

router.post('/create-location', authenticate, restrictTo('admin'), LocationCreationController.createLocation);
router.get('/list-locations', authenticate, restrictTo('admin'), LocationCreationController.listLocations);
router.post('/create-checkpoint', authenticate, restrictTo('admin'), LocationCreationController.createCheckpoint);

router.post('/availability', authenticate, restrictTo('admin'), AssignmentController.checkAvailability);
router.post('/assign-locations', authenticate, restrictTo('admin'), AssignmentController.assignLocation);
router.get('/list-assignments/:workerId', authenticate, restrictTo('admin'), AssignmentController.getAssignments);

// Profile retrieval route for logged-in admin
router.get('/profile', authenticate, restrictTo('admin'), ProfileRetrievalController.getProfile);
router.post('/edit-profile', authenticate, restrictTo('admin'), upload.single('profile_image'), AdminAuthController.editProfile);

router.get('/list-active', authenticate, restrictTo('admin'), ActivePatrolController.getActivePatrols);
router.get('/worker-locations', authenticate, restrictTo('admin'), ActivePatrolController.getWorkerLocations);
module.exports = router;