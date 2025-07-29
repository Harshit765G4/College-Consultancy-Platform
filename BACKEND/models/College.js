// models/College.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class College extends Model {
    static associate(models) {
      College.hasMany(models.Application, {
        foreignKey: 'collegeId',
        as: 'applications'
      });
      College.hasMany(models.FeeStructure, {
        foreignKey: 'collegeId',
        as: 'feeStructures'
      });
      College.belongsTo(models.User, {
        foreignKey: 'adminUserId',
        as: 'admin'
      });
    }
  }
  College.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    websiteUrl: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    adminUserId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if college is added by super admin
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'College',
    tableName: 'colleges',
    timestamps: true
  });
  return College;
};