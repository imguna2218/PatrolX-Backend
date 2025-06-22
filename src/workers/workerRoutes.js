const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateWorkerLogin } = require('../middleware/validationMiddleware');
const WorkerAuthController = require('./controllers/workerAuthController');
const ProfileRetrievalController = require('./controllers/profileRetrievalController');
const multer = require('multer');
const AssignmentController = require('./controllers/assignmentController');
const PatrolController = require('./controllers/patrolController');
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


console.log('WorkerAuthController:', WorkerAuthController); // Debug log
console.log('ProfileRetrievalController:', ProfileRetrievalController); // Debug log

router.post('/login', validateWorkerLogin, WorkerAuthController.login);
router.post('/logout', authenticate, restrictTo('worker'), WorkerAuthController.logout);


router.get('/profile', authenticate, restrictTo('worker'), ProfileRetrievalController.getProfile);
router.post('/edit-profile', authenticate, restrictTo('worker'), upload.single('profile_image'), WorkerAuthController.editProfile);

router.get('/list-assignments', authenticate, restrictTo('worker'), AssignmentController.getAssignments);

router.post('/start-patrol', authenticate, restrictTo('worker'), PatrolController.startPatrol);
router.get('/active-patrols', authenticate, restrictTo('worker'), PatrolController.getActivePatrols);
router.post('/cancel-patrol', authenticate, restrictTo('worker'), PatrolController.cancelPatrol);
router.get('/cancelled-patrols', authenticate, restrictTo('worker'), PatrolController.getCancelledPatrols);
router.post('/restart-patrol', authenticate, restrictTo('worker'), PatrolController.restartPatrol);

router.post('/location', authenticate, restrictTo('worker'), PatrolController.updateLocation);

router.post('/mark-checkpoint', authenticate, restrictTo('worker'), PatrolController.markCheckpoint);
router.post('/end-patrol', authenticate, restrictTo('worker'), PatrolController.endPatrol);
module.exports = router;