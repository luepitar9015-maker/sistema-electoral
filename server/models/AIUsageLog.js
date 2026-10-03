const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const AIUsageLog = sequelize.define('AIUsageLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false // 'gemini', 'mock', etc.
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    operation: {
        type: DataTypes.STRING,
        allowNull: false // 'video_analysis', 'content_comparison', 'hypotheses_generation', 'pattern_detection'
    },
    input_units: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // tokens o caracteres
    },
    output_units: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    estimated_cost_usd: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'AIUsageLogs',
    timestamps: true,
    indexes: [
        { fields: ['provider'] },
        { fields: ['campana_id'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = AIUsageLog;
