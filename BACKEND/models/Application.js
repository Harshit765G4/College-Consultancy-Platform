// models/Application.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Application extends Model {
    static associate(models) {
      Application.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
      Application.belongsTo(models.College, { foreignKey: 'collegeId', as: 'college' });
      Application.belongsTo(models.User, { foreignKey: 'reviewedByAdminId', as: 'adminReviewer' });
      Application.belongsTo(models.FeeStructure, { foreignKey: 'feeStructureId', as: 'approvedFeeStructure' });
      Application.hasMany(models.Document, { foreignKey: 'applicationId', as: 'documents' });
    }
  }
  Application.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    collegeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'colleges', key: 'id' }
    },
    programOfInterest: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      // MODIFIED: Added 'resubmission_approved' to the list of possible statuses
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'resubmission_approved'),
      allowNull: false,
      defaultValue: 'pending'
    },
    submissionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reviewedByAdminId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    feeStructureId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'fee_structures', key: 'id' }
    },
    // NEW: Field to track if a student has requested a resubmission
    resubmissionRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
    timestamps: true
  });
  return Application;
};