const db = require('../models'); // Import the db object containing all Sequelize models
const Profile = db.Profile;
const User = db.User; // Assuming User model is also exposed via db

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        // Use Sequelize's findOne with 'include' to fetch associated User data
        const profile = await Profile.findOne({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'user', // This must match the 'as' alias in your User-Profile association
                attributes: ['fullName', 'email', 'role'] // Select specific user attributes
            }]
        });

        if (!profile) {
            // If no profile record exists for the user, return a default empty structure
            // Fetch basic user data to pre-fill the readonly fields on frontend
            const user = await User.findByPk(req.user.id, {
                attributes: ['fullName', 'email', 'role']
            });

            if (!user) {
                return res.status(404).json({ msg: 'User not found for profile creation.' });
            }

            return res.json({
                // Directly return user details as a 'user' object for frontend consistency
                user: {
                    id: user.id, // Use 'id' for consistency with frontend currentUser
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                },
                phoneNumber: '',
                dateOfBirth: null, // Use null for date fields if empty
                address: '',
                education: {
                    grade10: { school: '', marks: '' },
                    grade12: { school: '', marks: '' }
                },
                skills: [],
                interests: []
            });
        }

        res.json(profile);
    } catch (err) {
        console.error('Error getting profile:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
exports.createOrUpdateProfile = async (req, res) => {
    const {
        phoneNumber,
        dateOfBirth,
        address,
        education, // Expected as an object { grade10: {school, marks}, grade12: {} }
        skills,    // Expected as an array of strings (or comma-separated string)
        interests  // Expected as an array of strings (or comma-separated string)
    } = req.body;

    const profileData = {
        userId: req.user.id,
    };

    if (phoneNumber !== undefined) profileData.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth || null; // Use null for empty date
    if (address !== undefined) profileData.address = address;

    // Sequelize DataTypes.JSONB/JSON expects a valid JSON object or null
    // Ensure education is a proper object, even if empty
    profileData.education = education || { grade10: {}, grade12: {} };

    // Handle skills and interests arrays - convert comma-separated string to array if needed
    if (skills !== undefined) {
        profileData.skills = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);
    } else {
        profileData.skills = []; // Default if not provided
    }

    if (interests !== undefined) {
        profileData.interests = Array.isArray(interests) ? interests : (typeof interests === 'string' ? interests.split(',').map(s => s.trim()).filter(Boolean) : []);
    } else {
        profileData.interests = []; // Default if not provided
    }

    try {
        // findOrCreate is excellent for this, it tries to find a record, if not found, it creates it.
        // It returns [instance, created] where 'created' is a boolean
        const [profile, created] = await Profile.findOrCreate({
            where: { userId: req.user.id },
            defaults: profileData // data to set if creating
        });

        if (!created) {
            // If record already existed, update it
            await profile.update(profileData);
        }

        // Fetch the updated profile including user data for a complete response
        const updatedProfile = await Profile.findOne({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['fullName', 'email', 'role']
            }]
        });

        res.status(created ? 201 : 200).json(updatedProfile); // 201 for created, 200 for updated

    } catch (err) {
        console.error('Error creating or updating profile:', err.message);
        // Log validation errors if any
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ msg: err.errors.map(e => e.message) });
        }
        res.status(500).send('Server Error');
    }
};