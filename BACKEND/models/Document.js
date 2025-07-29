// models/Document.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      Document.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        as: 'application'
      });
      Document.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'owner'
      });
    }
  }
  Document.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if it's a general user document
      references: {
        model: 'applications',
        key: 'id'
      }
    },
    userId: { // Owner of the document (student, college, etc.)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    documentType: {
      type: DataTypes.STRING, // e.g., 'transcript', 'resume', 'personal_statement', 'id_proof'
      allowNull: false
    },
    filePath: { // URL or path to stored file
      type: DataTypes.STRING,
      allowNull: false
    },
    originalFileName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true
  });
  return Document;
};