const jwt = require('jsonwebtoken');
const db = require('../models'); // Assuming this provides access to db.User

// Main authentication middleware
module.exports = async (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Use Sequelize's findByPk (find by Primary Key)
        const user = await db.User.findByPk(decoded.user.id, {
            attributes: { exclude: ['password'] } // Exclude password from the retrieved user object
        });

        if (!user) {
            return res.status(401).json({ msg: 'User not found, authorization denied' });
        }

        req.user = {
            id: user.id, // Sequelize instances have 'id' not '_id'
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        // Catch other JWT errors like JsonWebTokenError (invalid signature)
        if (err.name === 'JsonWebTokenError') {
             return res.status(401).json({ msg: 'Token is invalid' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Authorization middleware to check user roles
module.exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({ msg: 'Access denied: You do not have the required role' });
        }
        next();
    };
};