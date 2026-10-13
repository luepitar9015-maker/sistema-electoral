const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo ModerationReview
 * Bitácora de auditoría y revisión humana de clasificaciones de comentarios y alertas
 */
const ModerationReview = sequelize.define('ModerationReview', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    alert_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false // Usuario que realizó la moderación
    },
    // 'clasificacion_confirmada', 'clasificacion_corregida', 'marcado_como_critica_legitima', 'escalado_legal', 'descartado'
    accion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria_anterior: {
        type: DataTypes.STRING,
        allowNull: true
    },
    categoria_nueva: {
        type: DataTypes.STRING,
        allowNull: true
    },
    es_critica_legitima: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    motivo_cambio: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ModerationReviews',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['comment_id'] },
        { fields: ['user_id'] }
    ]
});

module.exports = ModerationReview;
