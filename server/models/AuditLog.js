const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false // Ej. 'LOGIN', 'ANALYSIS_CREATED', 'SIMULATION_RUN', 'SNAPSHOT_CAPTURED'
    },
    entity_type: {
        type: DataTypes.STRING,
        allowNull: false // Ej. 'SocialMediaPost', 'SocialExperiment', 'User'
    },
    entity_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    before_json: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    after_json: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata_json: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'AuditLogs',
    timestamps: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['campana_id'] },
        { fields: ['action'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = AuditLog;
