const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const Profile = db.Profile; // Import Profile model

exports.registerUser = async (req, res) => {
    const { fullName, email, password, role } = req.body; // Removed profile-specific fields from here

    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: role || 'student',
            // phoneNumber, // These fields are for Profile, not User directly
            // dateOfBirth,
            // address
        });

        // Optionally, create an empty profile for the new user immediately
        // This ensures a profile record always exists when a user is registered.
        await Profile.create({
            userId: user.id,
            // All other fields will take their defaultValue as defined in Profile model
        });

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ msg: 'User registered successfully', token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error('Error registering user:', err.message);
        res.status(500).send('Server error');
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ msg: 'Logged in successfully', token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error('Error logging in user:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error getting logged in user:', err.message);
        res.status(500).send('Server error');
    }
};