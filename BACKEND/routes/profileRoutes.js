const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/authMiddleware'); // Your authentication middleware
const profileController = require('../controllers/profileController');

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access   Private
router.get('/me', auth, profileController.getProfile);

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    '/',
    auth, // Authentication is always required for profile operations
    [
        // Optional: Add validation for incoming profile data
        // For example:
        // check('phoneNumber', 'Phone number is required').not().isEmpty(),
        // check('address', 'Address is required').not().isEmpty(),
        // check('education.grade10.school', '10th grade school is required').not().isEmpty(),
        // check('education.grade10.marks', '10th grade marks are required').not().isEmpty()
    ],
    profileController.createOrUpdateProfile
);

module.exports = router;