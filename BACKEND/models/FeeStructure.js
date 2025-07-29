// models/FeeStructure.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeeStructure extends Model {
    static associate(models) {
      FeeStructure.belongsTo(models.College, {
        foreignKey: 'collegeId',
        as: 'college'
      });
      FeeStructure.hasMany(models.Application, {
        foreignKey: 'feeStructureId',
        as: 'applications'
      });
    }
  }
  FeeStructure.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    collegeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'colleges',
        key: 'id'
      }
    },
    programName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tuitionFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    accommodationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    miscFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    isVisibleToStudents: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'FeeStructure',
    tableName: 'fee_structures',
    timestamps: true
  });
  return FeeStructure;
};