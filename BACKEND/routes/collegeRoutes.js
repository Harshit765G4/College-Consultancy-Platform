// routes/collegeRoutes.js
const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', collegeController.getAllColleges);
router.get('/:id', collegeController.getCollegeById);

// Admin/College Admin routes (require authentication and authorization)
router.post('/', authMiddleware, authMiddleware.authorize(['admin', 'college']), collegeController.addCollege);
router.put('/:id', authMiddleware, authMiddleware.authorize(['admin', 'college']), collegeController.updateCollege);
router.delete('/:id', authMiddleware, authMiddleware.authorize('admin'), collegeController.deleteCollege); // Only admin can delete

// Fee structure routes
router.post('/:collegeId/fees', authMiddleware, authMiddleware.authorize(['admin', 'college']), collegeController.addFeeStructure);
router.put('/:collegeId/fees/:feeId', authMiddleware, authMiddleware.authorize(['admin', 'college']), collegeController.updateFeeStructure);

module.exports = router;