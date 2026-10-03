const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialMetricSnapshot = sequelize.define('SocialMetricSnapshot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // 'real' para métricas de plataformas autorizadas, 'simulado' para el motor de juego/escenarios
    source: {
        type: DataTypes.ENUM('real', 'simulado'),
        defaultValue: 'real'
    },
    captured_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Métricas cuantitativas (admiten NULL: NULL != 0 cuando no están disponibles)
    views: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reach: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    impressions: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comments: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    shares: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    saves: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    clicks: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    watch_time: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    average_watch_time: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    completion_rate: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    growth_rate: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    retention_rate: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    momentum_score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fatigue_score: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}, {
    tableName: 'SocialMetricSnapshots',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['post_id'] },
        { fields: ['captured_at'] }
    ]
});

module.exports = SocialMetricSnapshot;
