// models/User.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: { // Assuming UUID for IDs
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('student', 'admin'),
            defaultValue: 'student'
        }
    }, {
        timestamps: true, // createdAt, updatedAt
        tableName: 'users'
    });

    User.associate = (models) => {
        // A User has one Profile
        models.User.hasOne(models.Profile, {
            foreignKey: 'userId', // This will be the column in the Profile table
            as: 'profile', // Alias for eager loading (e.g., User.findOne({ include: 'profile' }))
            onDelete: 'CASCADE', // If a User is deleted, delete their Profile
        });
        // A User has many Applications
        models.User.hasMany(models.Application, {
            foreignKey: 'userId',
            as: 'applications',
            onDelete: 'CASCADE',
        });
    };

    return User;
};