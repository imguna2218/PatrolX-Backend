// src/super-admin/super-adminRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateSuperAdmin, validateSuperAdminLogin, validateCreateAdmin } = require('../middleware/validationMiddleware');
const SuperAdminController = require('./super-adminController');
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


console.log('SuperAdminController:', SuperAdminController);
console.log('SuperAdminController.logout:', SuperAdminController.logout);
console.log('SuperAdminController.createAdmin:', SuperAdminController.createAdmin); // Debug log

router.post('/register', validateSuperAdmin, SuperAdminController.registerSuperAdmin);
router.post('/login', validateSuperAdminLogin, SuperAdminController.login);
router.post('/logout', authenticate, restrictTo('super_admin'), SuperAdminController.logout);
router.post('/create-admin', authenticate, restrictTo('super_admin'), validateCreateAdmin, SuperAdminController.createAdmin);
router.get('/list-admins', authenticate, restrictTo('super_admin'), SuperAdminController.listAdmins);
router.get('/profile', authenticate, restrictTo('super_admin'), SuperAdminController.getProfile);
router.post('/edit-profile', authenticate, restrictTo('super_admin'), upload.single('profile_image'), SuperAdminController.editProfile);


module.exports = router;