const { Model } = require('sequelize'); // Import Model directly

module.exports = (sequelize, DataTypes) => {
    class Profile extends Model {
        static associate(models) {
            // A Profile belongs to a User
            Profile.belongsTo(models.User, {
                foreignKey: 'userId', // The foreign key in the Profile table
                as: 'user', // Alias used for eager loading (e.g., Profile.findOne({ include: 'user' }))
                onDelete: 'CASCADE', // If the associated User is deleted, delete this Profile
            });
        }
    }
    Profile.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: { // Foreign key linking to User
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // Ensures only one profile per user
            references: {
                model: 'users', // Refers to the 'users' table
                key: 'id',
            },
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true, // Can be null
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY, // Stores date without time (e.g., 'YYYY-MM-DD')
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        education: {
            // Store as JSON/JSONB for nested objects in Sequelize
            type: DataTypes.JSONB, // Use DataTypes.JSONB for PostgreSQL, DataTypes.JSON for others (MySQL, SQLite)
            allowNull: true,
            defaultValue: { grade10: {}, grade12: {} } // Provide a default empty object
        },
        skills: {
            // Store as ARRAY for PostgreSQL. For other DBs, store as TEXT and manually parse/stringify.
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
            // Example for non-PostgreSQL (e.g., MySQL, SQLite)
            // type: DataTypes.TEXT,
            // get() { return this.getDataValue('skills') ? JSON.parse(this.getDataValue('skills')) : []; },
            // set(val) { this.setDataValue('skills', val ? JSON.stringify(val) : '[]'); }
        },
        interests: {
            // Same as skills
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    }, {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles', // Explicit table name
        timestamps: true, // Adds createdAt and updatedAt fields
    });

    return Profile;
};